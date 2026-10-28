import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Ellipse, Rectangle
import numpy as np

plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# ==============================================================================
# 1. USE CASE DIAGRAM
# ==============================================================================
def generate_use_case_diagram():
    fig, ax = plt.subplots(figsize=(16, 12), dpi=300)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')

    fig.patch.set_facecolor('#FAFAF9')
    ax.set_facecolor('#FAFAF9')

    # Title Banner
    ax.text(8.0, 11.5, "FreshBasket - System Use Case Diagram", 
            ha='center', va='center', fontsize=18, fontweight='bold', color='#14532D')
    ax.text(8.0, 11.15, "Group ID: F26PROJECT56E94 | Student ID: BC250206138 | Supervisor: Muhammad Hassaan", 
            ha='center', va='center', fontsize=10.5, color='#475569')

    # System Boundary Box
    system_box = FancyBboxPatch((2.6, 0.4), 10.8, 10.4,
                                boxstyle="round,pad=0.2,rounding_size=0.3",
                                facecolor="#FFFFFF", edgecolor="#16A34A", linewidth=2.2, linestyle='-')
    ax.add_patch(system_box)
    ax.text(8.0, 10.45, "System Boundary: FreshBasket Marketplace Platform", 
            ha='center', va='center', fontsize=12, fontweight='bold', color='#15803D',
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#DCFCE7", edgecolor="#86EFAC", lw=1))

    # Helper function for stick figures
    def draw_actor(x, y, label, role_color="#1E293B"):
        head = plt.Circle((x, y + 0.45), 0.2, color=role_color, ec='#0F172A', lw=1.5, zorder=5)
        ax.add_patch(head)
        ax.plot([x, x], [y + 0.25, y - 0.25], color='#0F172A', lw=2.2, zorder=5)
        ax.plot([x - 0.3, x + 0.3], [y + 0.08, y + 0.08], color='#0F172A', lw=2.2, zorder=5)
        ax.plot([x, x - 0.22], [y - 0.25, y - 0.65], color='#0F172A', lw=2.2, zorder=5)
        ax.plot([x, x + 0.22], [y - 0.25, y - 0.65], color='#0F172A', lw=2.2, zorder=5)
        ax.text(x, y - 0.9, label, ha='center', va='center', fontsize=9.5, fontweight='bold', color=role_color,
                bbox=dict(boxstyle="round,pad=0.22", facecolor="#F8FAFC", edgecolor="#CBD5E1", lw=1))

    # Draw 4 Actors
    draw_actor(1.2, 7.8, "Customer\n(End User)", "#047857")
    draw_actor(1.2, 2.5, "Farmer / Supplier\n(Producer)", "#0D9488")
    draw_actor(14.8, 8.2, "Administrator\n(Store Manager)", "#B45309")
    draw_actor(14.8, 3.2, "Logistics Lead\n(Dispatcher)", "#1D4ED8")

    # Use Cases (x, y, text, bg_color, border_color)
    use_cases = [
        # Customer core (col 1: x = 4.3)
        (4.3, 9.7, "Register & Manage\nUser Profile", "#F0FDF4", "#16A34A"),
        (4.3, 8.5, "Browse & Filter\nFresh Produce Catalog", "#F0FDF4", "#16A34A"),
        (4.3, 7.3, "Detect Geolocation &\nSelect Nearest Hub", "#F0FDF4", "#16A34A"),
        (4.3, 6.1, "Add Produce to Cart &\nChoose Unit Types", "#F0FDF4", "#16A34A"),
        (4.3, 4.9, "Checkout with Address &\nDelivery Time Slot", "#F0FDF4", "#16A34A"),
        (4.3, 3.7, "Pay via Cash on\nDelivery (COD)", "#F0FDF4", "#16A34A"),
        (4.3, 2.5, "Submit Star Rating &\nCustomer Review", "#FEF3C7", "#D97706"),
        (4.3, 1.3, "Submit Complaint Ticket\n& Track Ticket Status", "#FEE2E2", "#DC2626"),

        # Shared & Logistics (col 2: x = 8.0)
        (8.0, 9.2, "Track 5-Stage Live\nOrder Status", "#EFF6FF", "#2563EB"),
        (8.0, 7.8, "View Farm Origin &\nHarvest Freshness", "#F0FDF4", "#16A34A"),
        (8.0, 6.4, "Update Order Stage to\nPacked / Dispatched / Done", "#EFF6FF", "#2563EB"),
        (8.0, 4.8, "Assign Courier &\nMonitor Transit Map", "#EFF6FF", "#2563EB"),
        (8.0, 3.2, "Submit Harvest Lots &\nStock Supplies", "#CCFBF1", "#0D9488"),
        (8.0, 1.6, "Inspect Produce Quality &\nVerify Freshness Grade", "#FFFBEB", "#D97706"),

        # Admin core (col 3: x = 11.7)
        (11.7, 9.5, "Manage Products,\nUnits & Categories", "#FFFBEB", "#D97706"),
        (11.7, 8.2, "Monitor Sales Metrics &\nInventory Thresholds", "#FFFBEB", "#D97706"),
        (11.7, 6.8, "Moderate Customer Reviews\n& Publish Responses", "#FFFBEB", "#D97706"),
        (11.7, 5.3, "Review Complaints &\nSend Official Email Reply", "#FFFBEB", "#D97706"),
        (11.7, 3.8, "Manage User Roles &\nCustomer Accounts", "#FFFBEB", "#D97706"),
        (11.7, 2.2, "Audit System Logs &\nVerify Inventory History", "#FFFBEB", "#D97706"),
    ]

    for (ux, uy, utext, bg_color, border_color) in use_cases:
        ellipse = Ellipse((ux, uy), 2.3, 0.85, facecolor=bg_color, edgecolor=border_color, lw=1.6, zorder=3)
        ax.add_patch(ellipse)
        ax.text(ux, uy, utext, ha='center', va='center', fontsize=8.0, fontweight='bold', color='#1E293B', zorder=4)

    # Actor Associations
    # Customer lines (from (1.5, 7.8))
    cust_targets = [(4.3, 9.7), (4.3, 8.5), (4.3, 7.3), (4.3, 6.1), (4.3, 4.9), (4.3, 3.7), (4.3, 2.5), (4.3, 1.3), (8.0, 9.2), (8.0, 7.8)]
    for tx, ty in cust_targets:
        ax.plot([1.4, tx - 1.15], [7.8, ty], color='#047857', lw=1.1, alpha=0.7, zorder=2)

    # Farmer / Supplier lines (from (1.4, 2.5))
    supplier_targets = [(8.0, 3.2), (4.3, 8.5)]
    for tx, ty in supplier_targets:
        ax.plot([1.4, tx - 1.15], [2.5, ty], color='#0D9488', lw=1.2, alpha=0.75, zorder=2)

    # Admin lines (from (14.6, 8.2))
    admin_targets = [(11.7, 9.5), (11.7, 8.2), (11.7, 6.8), (11.7, 5.3), (11.7, 3.8), (11.7, 2.2), (8.0, 1.6), (8.0, 6.4)]
    for tx, ty in admin_targets:
        ax.plot([14.6, tx + 1.15], [8.2, ty], color='#B45309', lw=1.1, alpha=0.7, zorder=2)

    # Logistics Lead lines (from (14.6, 3.2))
    logistics_targets = [(8.0, 9.2), (8.0, 6.4), (8.0, 4.8), (4.3, 3.7)]
    for tx, ty in logistics_targets:
        ax.plot([14.6, tx + 1.15], [3.2, ty], color='#1D4ED8', lw=1.2, alpha=0.75, zorder=2)

    # <<include>> Checkout includes COD
    ax.annotate("<<include>>", xy=(4.3, 4.2), xytext=(4.3, 4.4),
                ha='center', fontsize=7.0, fontweight='bold', color='#B91C1C')
    ax.plot([4.3, 4.3], [4.45, 4.15], color='#B91C1C', lw=1.1, linestyle='--', zorder=4)

    # <<extend>> Browse Catalog extends Nutritional & Harvest Info
    ax.annotate("<<extend>>", xy=(6.15, 8.15), xytext=(6.15, 8.4),
                ha='center', fontsize=7.0, fontweight='bold', color='#4338CA')
    ax.plot([5.45, 6.85], [8.5, 7.8], color='#4338CA', lw=1.1, linestyle='--', zorder=4)

    plt.tight_layout()
    plt.savefig('diagrams/use_case_diagram.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("✓ Use Case Diagram generated: diagrams/use_case_diagram.png")


# ==============================================================================
# 2. WORK PLAN (GANTT CHART)
# ==============================================================================
def generate_work_plan_gantt():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
    fig.patch.set_facecolor('#FAFAF9')
    ax.set_facecolor('#FFFFFF')

    tasks = [
        "Assignment 1: Documentation (26 Oct 2026 - 09 Nov 2026)",
        "Phase 1.1: Literature Survey, Problem Definition & Requirements Gathering",
        "Phase 1.2: Software Requirements Specification (SRS) & Scope Formulation",
        "Phase 1.3: Architectural Modeling (Use Case Diagram & Tabular Scenarios)",
        "Phase 1.4: Conceptual ERD & Normalized Relational Database Schema Design",
        "Phase 1.5: Work Breakdown Structure, Gantt Schedule & UI Wireframes",
        "Assignment 2: Final Deliverable Implementation (10 Nov 2026 - 07 Jan 2027)",
        "Phase 2.1: Full-Stack Project Setup (React 18, Vite, Express, SQLite Schema)",
        "Phase 2.2: User Authentication, Argon2 Security & Role-Based Middleware",
        "Phase 2.3: Produce Catalog, Multi-Unit Selector (kg/g/dozen) & Filter Engine",
        "Phase 2.4: Shopping Cart, Order Placement & Cash-on-Delivery (COD) Flow",
        "Phase 2.5: Geoapify Geolocation (Doorstep Pin, 5 Regional Cold-Chain Hubs)",
        "Phase 2.6: Real-Time 5-Stage Logistics Tracking & Dispatch Supervisor Portal",
        "Phase 2.7: Verified Customer Reviews, Rating Moderation & Farm Quality Logs",
        "Phase 2.8: Complaint Center, Ticket Engine & Gmail SMTP Automated Emailing",
        "Phase 2.9: Mobile & Tablet Responsive Optimization (Tailwind Breakpoints)",
        "Phase 2.10: End-to-End Testing, Security Auditing, Performance Verification",
        "Phase 2.11: Final Project Documentation, Demonstration Video & Viva Defense"
    ]

    # Task durations: (start_week, duration_weeks, color, is_major)
    # Total span: 11 weeks (Oct 26, 2026 to Jan 07, 2027)
    schedules = [
        (1.0, 2.0, '#15803D', True),   # Assignment 1 Major
        (1.0, 0.8, '#4ADE80', False),
        (1.4, 0.8, '#4ADE80', False),
        (1.8, 0.6, '#4ADE80', False),
        (2.0, 0.6, '#4ADE80', False),
        (2.3, 0.7, '#4ADE80', False),
        (3.0, 8.5, '#0369A1', True),   # Assignment 2 Major
        (3.0, 1.2, '#38BDF8', False),
        (3.8, 1.2, '#38BDF8', False),
        (4.5, 1.5, '#38BDF8', False),
        (5.5, 1.5, '#38BDF8', False),
        (6.5, 1.2, '#38BDF8', False),
        (7.2, 1.5, '#38BDF8', False),
        (8.2, 1.2, '#38BDF8', False),
        (9.0, 1.2, '#38BDF8', False),
        (9.8, 1.0, '#38BDF8', False),
        (10.2, 0.8, '#38BDF8', False),
        (10.5, 0.8, '#059669', False)
    ]

    y_pos = np.arange(len(tasks))
    y_pos = y_pos[::-1]

    for i, (start, dur, color, is_major) in enumerate(schedules):
        h = 0.58 if is_major else 0.38
        y = y_pos[i] - h/2
        rect = FancyBboxPatch((start, y), dur, h,
                              boxstyle="round,pad=0.03,rounding_size=0.12",
                              facecolor=color, edgecolor='#0F172A' if is_major else 'none',
                              lw=1.2 if is_major else 0, alpha=0.92, zorder=3)
        ax.add_patch(rect)
        label_text = f"{dur:.1f}w" if dur < 1.0 else f"{dur:.1f}w"
        ax.text(start + dur / 2, y_pos[i], label_text, ha='center', va='center',
                fontsize=7.5, fontweight='bold', color='#FFFFFF' if is_major or color in ['#0369A1', '#15803D', '#059669'] else '#0F172A', zorder=4)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(tasks, fontsize=8.5)
    for tick, (start, dur, color, is_major) in zip(ax.get_yticklabels(), schedules):
        if is_major:
            tick.set_fontweight('bold')
            tick.set_color('#0F172A')
        else:
            tick.set_color('#475569')

    ax.set_xlim(0.8, 11.6)
    week_ticks = np.arange(1, 12)
    week_labels = [
        "W1\n(26 Oct)", "W2\n(02 Nov)", "W3\n(10 Nov)", "W4\n(17 Nov)",
        "W5\n(24 Nov)", "W6\n(01 Dec)", "W7\n(08 Dec)", "W8\n(15 Dec)",
        "W9\n(22 Dec)", "W10\n(29 Dec)", "W11\n(05 Jan)"
    ]
    ax.set_xticks(week_ticks)
    ax.set_xticklabels(week_labels, fontsize=8.5, fontweight='bold')
    ax.set_xlabel("Academic Project Calendar Schedule (26 October 2026 to 07 January 2027)", fontsize=11, fontweight='bold', labelpad=10)

    ax.grid(True, axis='x', color='#E2E8F0', linestyle='--', linewidth=0.8, zorder=0)

    # Key Milestones
    milestones = [
        (3.0, "M1: Assignment 1 Due (09 Nov 2026)", '#15803D'),
        (5.5, "M2: Storefront & Cart Engine (28 Nov 2026)", '#0284C7'),
        (8.5, "M3: Logistics & Complaints (18 Dec 2026)", '#D97706'),
        (10.5, "M4: QA Testing Complete (02 Jan 2027)", '#7C3AED'),
        (11.3, "M5: Final Submission (07 Jan 2027)", '#BE123C')
    ]
    for w, mlabel, mcolor in milestones:
        ax.axvline(w, color=mcolor, linestyle=':', lw=1.6, zorder=1)
        ax.text(w, len(tasks) - 0.2, f"♦ {mlabel}", rotation=42, ha='left', va='bottom',
                fontsize=7.5, fontweight='bold', color=mcolor, zorder=5)

    ax.set_title("FreshBasket - Work Plan & Gantt Chart\nGroup ID: F26PROJECT56E94 | Student ID: BC250206138 | Supervisor: Muhammad Hassaan", 
                 fontsize=13, fontweight='bold', color='#14532D', pad=36)

    plt.tight_layout()
    plt.savefig('diagrams/work_plan_gantt.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("✓ Work Plan Gantt Chart generated: diagrams/work_plan_gantt.png")


# ==============================================================================
# 3. ENTITY RELATIONSHIP DIAGRAM (ERD)
# ==============================================================================
def generate_erd_diagram():
    fig, ax = plt.subplots(figsize=(16, 12), dpi=300)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')

    fig.patch.set_facecolor('#FAFAF9')
    ax.set_facecolor('#FAFAF9')

    # Title
    ax.text(8.0, 11.6, "FreshBasket - Entity Relationship Diagram (ERD)", 
            ha='center', va='center', fontsize=17, fontweight='bold', color='#14532D')
    ax.text(8.0, 11.2, "Relational Data Model & Cardinalities | 14 Normalized System Entities", 
            ha='center', va='center', fontsize=10.5, color='#475569')

    def draw_entity(x, y, w, h, title, attributes, title_color="#16A34A"):
        header_h = 0.55
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.1",
                             facecolor="#FFFFFF", edgecolor="#334155", lw=1.3, zorder=3)
        ax.add_patch(box)
        hdr = FancyBboxPatch((x, y + h - header_h), w, header_h,
                             boxstyle="round,pad=0.02,rounding_size=0.1",
                             facecolor=title_color, edgecolor=title_color, lw=1, zorder=4)
        ax.add_patch(hdr)
        ax.text(x + w/2, y + h - header_h/2, title, ha='center', va='center',
                fontsize=9.0, fontweight='bold', color='#FFFFFF', zorder=5)

        line_y = y + h - header_h - 0.28
        for attr in attributes:
            color = "#0F172A"
            weight = "normal"
            if attr.startswith("PK"):
                color = "#B91C1C"
                weight = "bold"
            elif attr.startswith("FK"):
                color = "#2563EB"
                weight = "bold"
            ax.text(x + 0.15, line_y, attr, ha='left', va='center',
                    fontsize=7.5, fontweight=weight, color=color, zorder=5)
            line_y -= 0.25

    # 1. USERS
    draw_entity(0.6, 8.2, 3.2, 2.7, "USERS", [
        "PK  user_id : INT",
        "    full_name : VARCHAR(100)",
        "    email : VARCHAR(120) [UQ]",
        "    password_hash : VARCHAR(255)",
        "    phone_number : VARCHAR(20)",
        "    role : ENUM(cust,admin,logis,farm)",
        "    created_at : TIMESTAMP"
    ], "#0F766E")

    # 2. ADDRESSES
    draw_entity(0.6, 4.8, 3.2, 2.7, "ADDRESSES", [
        "PK  address_id : INT",
        "FK  user_id : INT",
        "    label : VARCHAR(50)",
        "    street_address : TEXT",
        "    latitude : DECIMAL(9,6)",
        "    longitude : DECIMAL(9,6)",
        "    nearest_hub_id : VARCHAR(60)"
    ], "#0284C7")

    # 3. COMPLAINTS
    draw_entity(0.6, 1.4, 3.2, 2.8, "COMPLAINTS", [
        "PK  complaint_id : INT",
        "FK  user_id : INT",
        "FK  order_id : INT",
        "    ticket_number : VARCHAR(30) [UQ]",
        "    category : VARCHAR(50)",
        "    status : ENUM(open,res,in_prog)",
        "    admin_reply : TEXT"
    ], "#DC2626")

    # 4. CATEGORIES
    draw_entity(4.4, 8.4, 3.2, 2.4, "CATEGORIES", [
        "PK  category_id : INT",
        "    name : VARCHAR(60)",
        "    slug : VARCHAR(60) [UQ]",
        "    description : TEXT",
        "    is_active : BOOLEAN"
    ], "#D97706")

    # 5. PRODUCTS
    draw_entity(4.4, 4.4, 3.2, 3.4, "PRODUCTS", [
        "PK  product_id : INT",
        "FK  category_id : INT",
        "    name : VARCHAR(120)",
        "    base_unit : VARCHAR(20)",
        "    base_price : DECIMAL(10,2)",
        "    stock_quantity : DECIMAL(10,2)",
        "    freshness_grade : VARCHAR(20)",
        "    freshness_score : INT",
        "    farm_origin : VARCHAR(120)",
        "    harvest_date : DATE"
    ], "#15803D")

    # 6. PRODUCT_UNITS
    draw_entity(4.4, 1.4, 3.2, 2.4, "PRODUCT_UNITS", [
        "PK  unit_id : INT",
        "FK  product_id : INT",
        "    unit_name : VARCHAR(40)",
        "    multiplier : DECIMAL(6,3)",
        "    price : DECIMAL(10,2)",
        "    is_default : BOOLEAN"
    ], "#047857")

    # 7. ORDERS
    draw_entity(8.2, 7.8, 3.3, 3.3, "ORDERS", [
        "PK  order_id : INT",
        "FK  user_id : INT",
        "FK  address_id : INT",
        "    order_number : VARCHAR(30) [UQ]",
        "    subtotal : DECIMAL(10,2)",
        "    delivery_fee : DECIMAL(10,2)",
        "    total_amount : DECIMAL(10,2)",
        "    payment_type : VARCHAR(20) [COD]",
        "    order_status : ENUM(5 stages)",
        "    assigned_courier : VARCHAR(100)",
        "    delivery_slot : VARCHAR(60)"
    ], "#B45309")

    # 8. ORDER_ITEMS
    draw_entity(8.2, 4.6, 3.3, 2.6, "ORDER_ITEMS", [
        "PK  order_item_id : INT",
        "FK  order_id : INT",
        "FK  product_id : INT",
        "    unit_name : VARCHAR(40)",
        "    unit_price : DECIMAL(10,2)",
        "    quantity : INT",
        "    item_subtotal : DECIMAL(10,2)"
    ], "#7C3AED")

    # 9. ORDER_STATUS_HISTORY
    draw_entity(8.2, 1.4, 3.3, 2.6, "ORDER_STATUS_HISTORY", [
        "PK  history_id : INT",
        "FK  order_id : INT",
        "FK  changed_by : INT",
        "    stage : VARCHAR(40)",
        "    notes : TEXT",
        "    created_at : TIMESTAMP"
    ], "#2563EB")

    # 10. REVIEWS
    draw_entity(12.1, 8.4, 3.3, 2.7, "REVIEWS", [
        "PK  review_id : INT",
        "FK  product_id : INT",
        "FK  user_id : INT",
        "FK  order_id : INT",
        "    rating : INT (1 to 5)",
        "    review_text : TEXT",
        "    is_approved : BOOLEAN"
    ], "#CA8A04")

    # 11. QUALITY_CHECKS
    draw_entity(12.1, 5.0, 3.3, 2.7, "QUALITY_CHECKS", [
        "PK  check_id : INT",
        "FK  product_id : INT",
        "FK  inspector_id : INT",
        "    batch_lot_code : VARCHAR(50)",
        "    grade : VARCHAR(20)",
        "    moisture_percentage : DECIMAL",
        "    check_timestamp : TIMESTAMP"
    ], "#475569")

    # 12. INVENTORY_LOGS
    draw_entity(12.1, 1.4, 3.3, 2.8, "INVENTORY_LOGS", [
        "PK  log_id : INT",
        "FK  product_id : INT",
        "FK  actor_id : INT",
        "    change_amount : DECIMAL(10,2)",
        "    reason : VARCHAR(60)",
        "    balance_after : DECIMAL(10,2)",
        "    logged_at : TIMESTAMP"
    ], "#334155")

    # Helper function for relationship lines
    def draw_rel(x1, y1, x2, y2, label="", color="#475569"):
        ax.plot([x1, x2], [y1, y2], color=color, lw=1.4, linestyle='-', zorder=2)
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        if label:
            ax.text(mid_x, mid_y + 0.12, label, ha='center', va='center',
                    fontsize=7.0, fontweight='bold', color=color,
                    bbox=dict(boxstyle="round,pad=0.15", facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=0.6))

    # Relationships
    draw_rel(2.2, 8.2, 2.2, 7.5, "1 : M") # USERS -> ADDRESSES
    draw_rel(3.8, 9.5, 8.2, 9.5, "1 : M") # USERS -> ORDERS
    draw_rel(3.8, 6.1, 8.2, 8.6, "1 : M") # ADDRESSES -> ORDERS
    draw_rel(2.2, 4.8, 2.2, 4.2, "1 : M") # USERS -> COMPLAINTS
    draw_rel(6.0, 8.4, 6.0, 7.8, "1 : M") # CATEGORIES -> PRODUCTS
    draw_rel(6.0, 4.4, 6.0, 3.8, "1 : M") # PRODUCTS -> PRODUCT_UNITS
    draw_rel(9.8, 7.8, 9.8, 7.2, "1 : M") # ORDERS -> ORDER_ITEMS
    draw_rel(9.8, 4.6, 9.8, 4.0, "1 : M") # ORDERS -> ORDER_STATUS_HISTORY
    draw_rel(7.6, 5.8, 8.2, 5.8, "1 : M") # PRODUCTS -> ORDER_ITEMS
    draw_rel(7.6, 5.0, 12.1, 9.2, "1 : M") # PRODUCTS -> REVIEWS
    draw_rel(7.6, 4.6, 12.1, 6.0, "1 : M") # PRODUCTS -> QUALITY_CHECKS
    draw_rel(7.6, 4.4, 12.1, 2.5, "1 : M") # PRODUCTS -> INVENTORY_LOGS

    plt.tight_layout()
    plt.savefig('diagrams/erd_diagram.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("✓ ERD Diagram generated: diagrams/erd_diagram.png")


# ==============================================================================
# 4. DATABASE RELATIONAL SCHEMA DIAGRAM
# ==============================================================================
def generate_db_schema_diagram():
    fig, ax = plt.subplots(figsize=(16, 12), dpi=300)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')

    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    ax.text(8.0, 11.6, "FreshBasket - Physical Relational Database Schema", 
            ha='center', va='center', fontsize=17, fontweight='bold', color='#0F172A')
    ax.text(8.0, 11.2, "SQLite 3NF Schema Architecture | Primary & Foreign Keys with Cascade Constraints", 
            ha='center', va='center', fontsize=10.5, color='#475569')

    def draw_schema_table(x, y, w, h, table_name, columns, header_bg="#1E293B"):
        header_h = 0.5
        box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.01,rounding_size=0.08",
                             facecolor="#FFFFFF", edgecolor="#64748B", lw=1.2, zorder=3)
        ax.add_patch(box)
        hdr = FancyBboxPatch((x, y + h - header_h), w, header_h,
                             boxstyle="round,pad=0.01,rounding_size=0.08",
                             facecolor=header_bg, edgecolor=header_bg, lw=1, zorder=4)
        ax.add_patch(hdr)
        ax.text(x + w/2, y + h - header_h/2, table_name, ha='center', va='center',
                fontsize=8.5, fontweight='bold', color='#FFFFFF', zorder=5)

        line_y = y + h - header_h - 0.24
        for col in columns:
            color = "#0F172A"
            weight = "normal"
            if col.startswith("PK"):
                color = "#DC2626"
                weight = "bold"
            elif col.startswith("FK"):
                color = "#2563EB"
                weight = "bold"
            ax.text(x + 0.12, line_y, col, ha='left', va='center',
                    fontsize=7.2, fontweight=weight, color=color, zorder=5)
            line_y -= 0.23

    # Row 1 (Top)
    draw_schema_table(0.5, 8.4, 3.4, 2.5, "users", [
        "PK  id : INTEGER AUTOINCREMENT",
        "    full_name : TEXT NOT NULL",
        "    email : TEXT UNIQUE NOT NULL",
        "    password_hash : TEXT NOT NULL",
        "    phone_number : TEXT",
        "    role : TEXT DEFAULT 'customer'",
        "    created_at : DATETIME"
    ], "#0F766E")

    draw_schema_table(4.3, 8.4, 3.4, 2.5, "categories", [
        "PK  id : INTEGER AUTOINCREMENT",
        "    name : TEXT NOT NULL",
        "    slug : TEXT UNIQUE NOT NULL",
        "    description : TEXT",
        "    is_active : INTEGER DEFAULT 1",
        "    display_order : INTEGER",
        "    created_at : DATETIME"
    ], "#D97706")

    draw_schema_table(8.1, 8.2, 3.5, 2.8, "orders", [
        "PK  id : INTEGER AUTOINCREMENT",
        "FK  user_id : INTEGER -> users(id)",
        "FK  address_id : INTEGER -> addresses(id)",
        "    order_number : TEXT UNIQUE",
        "    subtotal : REAL NOT NULL",
        "    delivery_fee : REAL DEFAULT 0",
        "    total_amount : REAL NOT NULL",
        "    order_status : TEXT DEFAULT 'pending'",
        "    payment_status : TEXT DEFAULT 'pending'",
        "    created_at : DATETIME"
    ], "#B45309")

    draw_schema_table(12.0, 8.4, 3.5, 2.6, "complaints", [
        "PK  id : INTEGER AUTOINCREMENT",
        "FK  user_id : INTEGER -> users(id)",
        "FK  order_id : INTEGER -> orders(id)",
        "    ticket_number : TEXT UNIQUE",
        "    category : TEXT NOT NULL",
        "    status : TEXT DEFAULT 'open'",
        "    admin_reply : TEXT",
        "    created_at : DATETIME"
    ], "#DC2626")

    # Row 2 (Middle)
    draw_schema_table(0.5, 4.9, 3.4, 2.7, "addresses", [
        "PK  id : INTEGER AUTOINCREMENT",
        "FK  user_id : INTEGER -> users(id)",
        "    label : TEXT",
        "    street_address : TEXT NOT NULL",
        "    city : TEXT NOT NULL",
        "    latitude : REAL",
        "    longitude : REAL",
        "    nearest_hub_id : TEXT",
        "    is_default : INTEGER DEFAULT 0"
    ], "#0284C7")

    draw_schema_table(4.3, 4.6, 3.4, 3.2, "products", [
        "PK  id : INTEGER AUTOINCREMENT",
        "FK  category_id : INTEGER -> categories(id)",
        "    name : TEXT NOT NULL",
        "    slug : TEXT UNIQUE NOT NULL",
        "    base_unit : TEXT NOT NULL",
        "    base_price : REAL NOT NULL",
        "    stock_quantity : REAL NOT NULL",
        "    freshness_grade : TEXT DEFAULT 'A'",
        "    freshness_score : INTEGER DEFAULT 95",
        "    farm_origin : TEXT",
        "    harvest_date : TEXT"
    ], "#15803D")

    draw_schema_table(8.1, 4.9, 3.5, 2.5, "order_items", [
        "PK  id : INTEGER AUTOINCREMENT",
        "FK  order_id : INTEGER -> orders(id)",
        "FK  product_id : INTEGER -> products(id)",
        "    unit_name : TEXT NOT NULL",
        "    unit_price : REAL NOT NULL",
        "    quantity : INTEGER NOT NULL",
        "    subtotal : REAL NOT NULL"
    ], "#7C3AED")

    draw_schema_table(12.0, 5.0, 3.5, 2.5, "reviews", [
        "PK  id : INTEGER AUTOINCREMENT",
        "FK  product_id : INTEGER -> products(id)",
        "FK  user_id : INTEGER -> users(id)",
        "FK  order_id : INTEGER -> orders(id)",
        "    rating : INTEGER CHECK (1..5)",
        "    review_text : TEXT",
        "    is_verified : INTEGER DEFAULT 1"
    ], "#CA8A04")

    # Row 3 (Bottom)
    draw_schema_table(0.5, 1.4, 3.4, 2.6, "coupons", [
        "PK  id : INTEGER AUTOINCREMENT",
        "    code : TEXT UNIQUE NOT NULL",
        "    discount_type : TEXT",
        "    discount_value : REAL NOT NULL",
        "    min_order_amount : REAL DEFAULT 0",
        "    is_active : INTEGER DEFAULT 1",
        "    expires_at : DATETIME"
    ], "#047857")

    draw_schema_table(4.3, 1.4, 3.4, 2.5, "product_units", [
        "PK  id : INTEGER AUTOINCREMENT",
        "FK  product_id : INTEGER -> products(id)",
        "    unit_name : TEXT NOT NULL",
        "    multiplier : REAL NOT NULL",
        "    price : REAL NOT NULL",
        "    is_default : INTEGER DEFAULT 0"
    ], "#059669")

    draw_schema_table(8.1, 1.4, 3.5, 2.6, "order_status_history", [
        "PK  id : INTEGER AUTOINCREMENT",
        "FK  order_id : INTEGER -> orders(id)",
        "FK  changed_by : INTEGER -> users(id)",
        "    status : TEXT NOT NULL",
        "    notes : TEXT",
        "    created_at : DATETIME"
    ], "#2563EB")

    draw_schema_table(12.0, 1.4, 3.5, 2.6, "inventory_logs", [
        "PK  id : INTEGER AUTOINCREMENT",
        "FK  product_id : INTEGER -> products(id)",
        "FK  actor_id : INTEGER -> users(id)",
        "    change_amount : REAL NOT NULL",
        "    reason : TEXT NOT NULL",
        "    balance_after : REAL NOT NULL",
        "    created_at : DATETIME"
    ], "#334155")

    plt.tight_layout()
    plt.savefig('diagrams/database_schema.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("✓ Database Relational Schema Diagram generated: diagrams/database_schema.png")

if __name__ == '__main__':
    print("Generating diagrams...")
    generate_use_case_diagram()
    generate_work_plan_gantt()
    generate_erd_diagram()
    generate_db_schema_diagram()
    print("All diagrams generated successfully.")
