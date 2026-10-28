import { db, runTransaction } from '../db/connection.js';
import {
  sendComplaintCustomerConfirmation,
  sendComplaintAdminNotification,
  sendComplaintResolutionEmail
} from '../services/emailService.js';

/**
 * Submit a Customer Complaint or Quality Dispute
 * POST /api/complaints
 * Open to both authenticated users and guest buyers
 */
export async function submitComplaint(req, res) {
  try {
    const {
      name,
      email,
      phone,
      order_id,
      order_number,
      category = 'Produce Freshness & Quality',
      subject,
      message,
      attachment_url
    } = req.body;

    const finalName = (name || req.user?.full_name || '').trim();
    const finalEmail = (email || req.user?.email || '').trim();
    const finalPhone = (phone || req.user?.phone_number || '').trim();

    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }
    if (!finalEmail || !finalEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address so we can reply.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a complaint subject.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Please explain the issue details in your message.' });
    }

    // Determine order_id if order_number was supplied
    let resolvedOrderId = order_id ? Number(order_id) : null;
    let resolvedOrderNumber = order_number || null;

    if (!resolvedOrderId && resolvedOrderNumber) {
      const cleanNum = resolvedOrderNumber.trim().replace(/^#+/, '');
      const ord = db.prepare('SELECT id, order_number FROM orders WHERE order_number = ? OR order_number = ? OR id = ?')
        .get(cleanNum, `#${cleanNum}`, cleanNum);
      if (ord) {
        resolvedOrderId = ord.id;
        resolvedOrderNumber = ord.order_number;
      }
    } else if (resolvedOrderId && !resolvedOrderNumber) {
      const ord = db.prepare('SELECT order_number FROM orders WHERE id = ?').get(resolvedOrderId);
      if (ord) resolvedOrderNumber = ord.order_number;
    }

    // Generate unique ticket number FB-TKT-XXXXX
    const ticketNumber = `FB-TKT-${Math.floor(10000 + Math.random() * 90000)}`;

    const insert = db.prepare(`
      INSERT INTO complaints (
        ticket_number, order_id, user_id, customer_name, customer_email,
        customer_phone, category, subject, message, attachment_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')
    `);

    const result = insert.run(
      ticketNumber,
      resolvedOrderId,
      req.user?.id || null,
      finalName,
      finalEmail,
      finalPhone,
      category,
      subject.trim(),
      message.trim(),
      attachment_url || null
    );

    const complaintRecord = db.prepare('SELECT * FROM complaints WHERE id = ?').get(result.lastInsertRowid);

    // Send Emails asynchronously without blocking response
    (async () => {
      try {
        // 1. Send customer confirmation email
        await sendComplaintCustomerConfirmation({
          customerName: finalName,
          customerEmail: finalEmail,
          ticketNumber,
          orderNumber: resolvedOrderNumber,
          category,
          subject: subject.trim(),
          message: message.trim()
        });
        console.log(`[Email] Customer confirmation sent to ${finalEmail} for ticket #${ticketNumber}`);
      } catch (err) {
        console.error('[Email Error] Failed to send customer confirmation:', err.message);
      }

      try {
        // 2. Send support notification to muzammilshabbircs01@gmail.com
        await sendComplaintAdminNotification({
          customerName: finalName,
          customerEmail: finalEmail,
          customerPhone: finalPhone,
          ticketNumber,
          orderNumber: resolvedOrderNumber,
          category,
          subject: subject.trim(),
          message: message.trim(),
          attachmentUrl: attachment_url
        });
        console.log(`[Email] Admin dispute alert sent to support for ticket #${ticketNumber}`);
      } catch (err) {
        console.error('[Email Error] Failed to send admin notification:', err.message);
      }
    })();

    return res.status(201).json({
      success: true,
      message: `Your complaint has been submitted successfully! Ticket Reference #${ticketNumber}. A confirmation email has been dispatched to ${finalEmail}.`,
      ticket_number: ticketNumber,
      complaint: complaintRecord
    });
  } catch (error) {
    console.error('submitComplaint error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record complaint. Please try again.' });
  }
}

/**
 * Public Ticket Tracking for Customers
 * GET /api/complaints/track/:ticket
 */
export function getComplaintByTicket(req, res) {
  try {
    const { ticket } = req.params;
    const cleanTicket = ticket.trim().replace(/^#+/, '');

    const complaint = db.prepare(`
      SELECT c.*, o.order_number, o.created_at as order_date, o.total_amount
      FROM complaints c
      LEFT JOIN orders o ON c.order_id = o.id
      WHERE c.ticket_number = ? OR c.ticket_number = ?
    `).get(cleanTicket, `FB-TKT-${cleanTicket}`);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'No ticket record found with that reference number.' });
    }

    return res.json({ success: true, complaint });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to lookup ticket.' });
  }
}

/**
 * Customer Complaint History
 * GET /api/complaints/my
 */
export function getUserComplaints(req, res) {
  try {
    const complaints = db.prepare(`
      SELECT c.*, o.order_number
      FROM complaints c
      LEFT JOIN orders o ON c.order_id = o.id
      WHERE c.user_id = ? OR c.customer_email = ?
      ORDER BY c.id DESC
    `).all(req.user.id, req.user.email);

    return res.json({ success: true, complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load user complaints.' });
  }
}

/**
 * Admin List All Complaints
 * GET /api/admin/complaints
 */
export function adminListComplaints(req, res) {
  try {
    const { status, search } = req.query;
    let whereClauses = [];
    let params = [];

    if (status && status !== 'all') {
      whereClauses.push('c.status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(c.ticket_number) LIKE ? OR LOWER(c.customer_name) LIKE ? OR LOWER(c.customer_email) LIKE ? OR LOWER(c.subject) LIKE ?)');
      params.push(q, q, q, q);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const complaints = db.prepare(`
      SELECT c.*, o.order_number, o.total_amount
      FROM complaints c
      LEFT JOIN orders o ON c.order_id = o.id
      ${whereSql}
      ORDER BY 
        CASE c.status
          WHEN 'Open' THEN 1
          WHEN 'In Review' THEN 2
          WHEN 'Resolved' THEN 3
          ELSE 4
        END,
        c.id DESC
    `).all(...params);

    return res.json({ success: true, complaints });
  } catch (error) {
    console.error('adminListComplaints error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load complaints for admin.' });
  }
}

/**
 * Admin Reply & Resolve Complaint
 * PUT /api/admin/complaints/:id/reply
 */
export async function adminReplyComplaint(req, res) {
  try {
    const { id } = req.params;
    const { admin_reply, status = 'Resolved' } = req.body;

    if (!admin_reply || !admin_reply.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a resolution reply message.' });
    }

    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint record not found.' });
    }

    db.prepare(`
      UPDATE complaints
      SET admin_reply = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(admin_reply.trim(), status, complaint.id);

    const updatedComplaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);

    // Send official resolution email to customer via Gmail SMTP
    if (complaint.customer_email) {
      (async () => {
        try {
          await sendComplaintResolutionEmail({
            customerName: complaint.customer_name || 'Valued Customer',
            customerEmail: complaint.customer_email,
            ticketNumber: complaint.ticket_number || `FB-TKT-${complaint.id}`,
            subject: complaint.subject,
            adminReply: admin_reply.trim(),
            status,
            adminName: req.user?.full_name || 'FreshBasket Support Lead'
          });
          console.log(`[Email] Resolution sent to ${complaint.customer_email} for ticket ${complaint.ticket_number}`);
        } catch (err) {
          console.error('[Email Error] Failed to send resolution email:', err.message);
        }
      })();
    }

    return res.json({
      success: true,
      message: `Complaint #${complaint.ticket_number || complaint.id} updated to "${status}". Official resolution dispatched to ${complaint.customer_email}.`,
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('adminReplyComplaint error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record resolution.' });
  }
}
