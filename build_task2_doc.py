import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_document():
    doc = Document()

    # Configure Margins: 1 inch all around
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles Setup
    styles = doc.styles

    # Normal Style (Body Text)
    normal_style = styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x33, 0x41, 0x55) # Slate 700
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # Helper functions for formatting
    def add_title(text, size=24, color=(0x14, 0x53, 0x2D), bold=True, space_after=12, align=WD_ALIGN_PARAGRAPH.CENTER):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.color.rgb = RGBColor(*color)
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(15)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x14, 0x53, 0x2D) # Forest Green
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(12.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x15, 0x80, 0x3D) # Emerald Green
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Arial'
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B) # Slate 800
        return p

    def add_p(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.bold = True
            r_bold.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        r_text = p.add_run(text)
        r_text.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        return p

    def add_bullet(text, bold_prefix=None, level=0):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.bold = True
            r_bold.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        r_text = p.add_run(text)
        r_text.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        return p

    def set_cell_background(cell, hex_color):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def format_table(table, col_widths, headers, data, header_bg="15803D"):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        # Format Header Row
        hdr_cells = table.rows[0].cells
        for idx, text in enumerate(headers):
            hdr_cells[idx].text = text
            set_cell_background(hdr_cells[idx], header_bg)
            set_cell_margins(hdr_cells[idx], top=120, bottom=120, left=140, right=140)
            p = hdr_cells[idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = 'Arial'
                r.font.bold = True
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

        # Format Data Rows
        for row_idx, row_data in enumerate(data):
            row_cells = table.rows[row_idx + 1].cells
            bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            for col_idx, cell_value in enumerate(row_data):
                row_cells[col_idx].text = str(cell_value)
                set_cell_background(row_cells[col_idx], bg_color)
                set_cell_margins(row_cells[col_idx], top=90, bottom=90, left=140, right=140)
                p = row_cells[col_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.name = 'Arial'
                    r.font.size = Pt(9)
                    r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

        # Set Column Widths
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = width

    def add_callout(text, title="NOTE / SPECIFICATION"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        c = tbl.cell(0, 0)
        c.width = Inches(6.5)
        set_cell_background(c, "F0FDF4") # Pale green
        set_cell_margins(c, top=140, bottom=140, left=180, right=180)
        p = c.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r_title = p.add_run(f"📌 {title}: ")
        r_title.font.bold = True
        r_title.font.size = Pt(9.5)
        r_title.font.color.rgb = RGBColor(0x15, 0x80, 0x3D)
        r_body = p.add_run(text)
        r_body.font.size = Pt(9)
        r_body.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_image_figure(img_path, caption, width=Inches(6.2)):
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(8)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.paragraph_format.keep_with_next = True
            run = p_img.add_run()
            run.add_picture(img_path, width=width)

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(12)
            r_cap = p_cap.add_run(f"Figure: {caption}")
            r_cap.font.name = 'Arial'
            r_cap.font.size = Pt(9)
            r_cap.font.italic = True
            r_cap.font.bold = True
            r_cap.font.color.rgb = RGBColor(0x47, 0x55, 0x69)
        else:
            add_p(f"[Image placeholder: {caption} - File {img_path} not found]")

    # ==========================================================================
    # COVER / TITLE PAGE
    # ==========================================================================
    for _ in range(3):
        doc.add_paragraph()

    add_title("FreshBasket", size=32, color=(0x14, 0x53, 0x2D), bold=True, space_after=6)
    add_title("Online Fresh Fruits, Vegetables & Essential Grocery Delivery Platform", 
              size=14, color=(0x15, 0x80, 0x3D), bold=False, space_after=24)

    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_div = p_div.add_run("____________________________________________________")
    r_div.font.color.rgb = RGBColor(0x86, 0xEF, 0xAC)
    p_div.paragraph_format.space_after = Pt(28)

    add_title("Documentation (First Deliverable)", size=18, color=(0x0F, 0x17, 0x2A), bold=True, space_after=8)
    add_title("Software Requirements Specification (SRS) & System Design", size=12, color=(0x47, 0x55, 0x69), bold=False, space_after=32)

    meta_tbl = doc.add_table(rows=4, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Document Version:", "Version 1.0 (Formal Deliverable)"),
        ("Group ID:", "BC200401892 (Virtual University)"),
        ("Project Supervisor:", "Muhammad Hassaan"),
        ("Supervisor Contact:", "m.hassaan@vu.edu.pk")
    ]
    for idx, (label, val) in enumerate(meta_data):
        row = meta_tbl.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(3.8)
        c0.text = label
        c1.text = val
        c0.paragraphs[0].runs[0].font.bold = True
        c0.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        c1.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x14, 0x53, 0x2D)
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)

    for _ in range(4):
        doc.add_paragraph()

    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_foot = p_foot.add_run("Department of Computer Science\nVirtual University of Pakistan\nAcademic Year 2026")
    r_foot.font.size = Pt(10)
    r_foot.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    doc.add_page_break()

    # ==========================================================================
    # REVISION HISTORY & TABLE OF CONTENTS
    # ==========================================================================
    add_h1("Revision History")
    add_p("The table below documents the chronological evolutionary lifecycle, modification records, and editorial authorizations for this First Deliverable specification document.")

    rev_tbl = doc.add_table(rows=4, cols=4)
    rev_headers = ["Date (dd/mm/yyyy)", "Version", "Description", "Author(s)"]
    rev_data = [
        ["28/10/2026", "1.0", "Initial Comprehensive First Deliverable: SRS, Use Cases, Work Plan Gantt, ERD, Relational Database Schema & High-Fidelity Interface Designs", "Group ID: BC200401892"],
        ["--", "--", "Pending Supervisor Review & Iterative Revisions", "Muhammad Hassaan"],
        ["--", "--", "Final Project Integration & Comprehensive Codebase Delivery", "BC200401892"]
    ]
    format_table(rev_tbl, [Inches(1.5), Inches(0.9), Inches(2.6), Inches(1.5)], rev_headers, rev_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    add_h1("Table of Contents")
    toc_items = [
        ("1. Introduction of Document", "3"),
        ("   1.1 Purpose and Architectural Objectives of the Document", "3"),
        ("   1.2 Benefits & Strategic Value of the First Deliverable Phase in SDLC", "3"),
        ("   1.3 Structural Inclusions and Overview", "4"),
        ("2. Scope (of the Project)", "5"),
        ("   2.1 Project Background & Contemporary Problem Statement", "5"),
        ("   2.2 System Objectives & Strategic Value Proposition", "5"),
        ("   2.3 Target User Community & Key Stakeholders", "6"),
        ("   2.4 Project Boundaries, Inclusions, and Out-of-Scope Elements", "6"),
        ("   2.5 High-Level Technological Architecture", "7"),
        ("3. Functional Requirements & Non-Functional Requirements", "8"),
        ("   3.1 Detailed Functional Requirements (FR-01 to FR-10)", "8"),
        ("   3.2 Comprehensive Non-Functional Requirements (NFR-01 to NFR-05)", "11"),
        ("4. Use Case Diagram", "13"),
        ("   4.1 System Actors & Operational Roles", "13"),
        ("   4.2 High-Resolution Architectural Use Case Diagram", "14"),
        ("   4.3 Core Use Case Specifications (Tabular Execution Scenarios)", "15"),
        ("5. Work Plan (Gantt Chart)", "18"),
        ("   5.1 Work Breakdown Structure (WBS) & Lifecycle Phases", "18"),
        ("   5.2 Milestone Deliverables & Timeline Schedule", "19"),
        ("   5.3 High-Resolution Project Gantt Chart", "20"),
        ("6. Entity Relationship Diagram (ERD)", "21"),
        ("   6.1 Conceptual Data Model & Cardinality Logic", "21"),
        ("   6.2 High-Resolution Entity Relationship Diagram (Crow's Foot)", "22"),
        ("   6.3 Detailed Entity Dictionary & Attribute Specifications", "23"),
        ("7. Database Design", "25"),
        ("   7.1 Physical Relational Schema Architecture & Normalization", "25"),
        ("   7.2 Physical Relational Schema Diagram", "26"),
        ("   7.3 Complete Database Table Specifications (Data Dictionaries)", "27"),
        ("8. Interface Design", "31"),
        ("   8.1 User Interface Design Philosophy & Visual System", "31"),
        ("   8.2 GUI Interface 1: Customer Storefront & Dynamic Multi-Filter Catalog", "32"),
        ("   8.3 GUI Interface 2: Dynamic Product Detail & Farm Freshness Modal", "33"),
        ("   8.4 GUI Interface 3: Interactive Shopping Basket & Cash-on-Delivery Checkout Flow", "34"),
        ("   8.5 GUI Interface 4: Live Visual 4-Stage Order Tracking Portal", "35"),
        ("   8.6 GUI Interface 5: Admin Control Center & Freshness Quality Inspection Dashboard", "36"),
    ]

    for item, page in toc_items:
        p_toc = doc.add_paragraph()
        p_toc.paragraph_format.space_after = Pt(2)
        p_toc.paragraph_format.line_spacing = 1.15
        is_main = not item.startswith("   ")
        r_item = p_toc.add_run(item)
        r_item.font.bold = is_main
        r_item.font.size = Pt(10 if is_main else 9.5)
        r_item.font.color.rgb = RGBColor(0x14, 0x53, 0x2D) if is_main else RGBColor(0x33, 0x41, 0x55)

        # Tab leader
        dots_count = max(4, 75 - len(item))
        r_dots = p_toc.add_run(" " + "." * dots_count + " ")
        r_dots.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)

        r_page = p_toc.add_run(page)
        r_page.font.bold = is_main
        r_page.font.size = Pt(9.5)
        r_page.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    doc.add_page_break()

    # ==========================================================================
    # SECTION 1: INTRODUCTION OF DOCUMENT
    # ==========================================================================
    add_h1("1. Introduction of Document")

    add_h2("1.1 Purpose and Architectural Objectives of the Document")
    add_p("This document constitutes the official First Deliverable (Software Requirements Specification - SRS & Architectural Design) for the FreshBasket project. The central purpose of this document is to formulate an unambiguous, rigorous, and verifiable technical contract between the project stakeholders, academic evaluators, supervisor, and system developers. It captures the comprehensive functional, non-functional, behavioral, structural, and relational requirements governing the FreshBasket farm-to-doorstep web application.")
    add_p("The document bridges the conceptual vision of FreshBasket with concrete engineering specifications. By defining detailed actors, use case workflows, work schedules, entity models, database schemas, and user interfaces, this deliverable ensures that subsequent development iterations proceed upon a validated, coherent, and structurally sound foundation.")

    add_h2("1.2 Benefits & Strategic Value of the First Deliverable Phase in SDLC")
    add_p("In modern software engineering methodologies (including Agile, iterative Waterfall, and Unified Process models), the Requirements Analysis and Architectural Design phase represents the single highest return-on-investment phase in the entire project lifecycle. Empirical studies across software engineering demonstrate that resolving ambiguities, functional conflicts, and structural defects during the requirements phase is between 50 to 100 times less expensive than correcting them during late testing or post-deployment phases.")
    add_p("Specifically, this First Deliverable phase delivers the following strategic benefits to the FreshBasket system:")
    add_bullet("Risk Mitigation and Scope Boundary Containment: Eliminates scope creep by explicitly defining what falls inside the project boundaries (e.g., farm-direct fruit/vegetable ordering, multi-unit price calculations, Cash on Delivery fulfillment, live 4-stage tracking, and admin quality inspection logs) and what is out of scope (e.g., third-party international couriers or cold-chain drone dispatch).", bold_prefix="a. ")
    add_bullet("Stakeholder & Supervisor Alignment: Provides academic supervisor Muhammad Hassaan and faculty evaluators with a transparent, structured roadmap to evaluate technical rigor, feasibility, architectural integrity, and domain complexity.", bold_prefix="b. ")
    add_bullet("Architectural Traceability: Establishes complete bidirectional traceability from high-level problem statements to functional requirement IDs (FR-01 to FR-10), use cases, database tables, and corresponding graphical user interface screens.", bold_prefix="c. ")
    add_bullet("Engineering Blueprint for Implementation: Furnishes developers with finalized relational table schemas, primary/foreign key definitions, validation constraints, and responsive GUI interaction patterns, preventing redundant refactoring during the coding sprints.", bold_prefix="d. ")
    add_bullet("Verifiable Quality & Acceptance Baseline: Supplies the quality assurance team with measurable performance, security, and usability criteria against which final deliverables can be tested and certified during viva presentations.", bold_prefix="e. ")

    add_h2("1.3 Structural Inclusions and Overview")
    add_p("To provide an exhaustive specification, this First Deliverable document incorporates eight cohesive analytical sections:")
    add_bullet("Project Scope: Defines the industrial context, agricultural supply-chain challenges, customer pain points, target audiences, and core value proposition of FreshBasket.", bold_prefix="• ")
    add_bullet("Functional & Non-Functional Requirements: Contains ten granular, numbered functional requirement modules and five categories of rigorous non-functional quality attributes.", bold_prefix="• ")
    add_bullet("Use Case Modeling: Formulates actor roles (Customer, Administrator, Delivery Staff) accompanied by a high-resolution UML Use Case diagram and tabular behavioral scenario specifications.", bold_prefix="• ")
    add_bullet("Work Plan & Gantt Chart: Details the 18-week project lifecycle, Work Breakdown Structure (WBS), milestone dates, and visual schedule.", bold_prefix="• ")
    add_bullet("Entity Relationship Diagram (ERD): Details the logical data schema, Crow's foot cardinalities, primary/foreign key relationships, and complete attribute specifications.", bold_prefix="• ")
    add_bullet("Database Design: Supplies the physical relational schema diagram, 3NF normalization justification, and eight fully articulated table dictionaries.", bold_prefix="• ")
    add_bullet("Interface Design: Furnishes high-resolution screenshots and detailed walkthroughs of five major interactive GUIs developed for the live FreshBasket system.", bold_prefix="• ")

    doc.add_page_break()

    # ==========================================================================
    # SECTION 2: SCOPE OF THE PROJECT
    # ==========================================================================
    add_h1("2. Scope (of the Project)")

    add_h2("2.1 Project Background & Contemporary Problem Statement")
    add_p("In conventional agricultural and grocery supply chains across developing urban centers, the journey of fresh fruits and vegetables from orchard to dining table is plagued by extensive middleman layers, multi-day delays in non-climate-controlled wholesale markets (mandis), and severe physical handling decay. Traditional retail grocery models force consumers to physically visit crowded markets or rely on general e-commerce marketplaces where perishable produce is stored in centralized warehouses for days, leading to nutritional loss, dehydration, and stale produce.")
    add_p("Furthermore, existing online grocery platforms present severe systemic deficiencies:")
    add_bullet("Lack of Freshness Transparency: Consumers have zero visibility into when produce was harvested, its farm origin, or its freshness grade prior to dispatch.", bold_prefix="1. ")
    add_bullet("Rigid Measurement Units: Most websites enforce rigid 1 kg packings, ignoring consumers needing smaller fractional units (e.g., 250g coriander, 500g baby spinach) or alternative units (dozens, bunches, individual pieces).", bold_prefix="2. ")
    add_bullet("Absence of Farm-to-Fork Traceability: Small local growers are divorced from the consumer, receiving meager percentages of market prices while middlemen capture oversized profit margins.", bold_prefix="3. ")
    add_bullet("Delivery Uncertainty and Payment Reluctance: Consumers are hesitant to prepay online for perishables due to fear of receiving damaged or rotting produce, necessitating a reliable Cash on Delivery (COD) mechanism combined with doorstep inspection.", bold_prefix="4. ")

    add_h2("2.2 System Objectives & Strategic Value Proposition")
    add_p("FreshBasket is engineered as a dedicated, high-performance web platform that directly connects urban households with verified local farmers, fruit orchards, and peri-urban vegetable growers. The core strategic objectives of the system are:")
    add_bullet("Direct Farm-to-Doorstep Fulfillment: Eliminate intermediate wholesale middlemen, guaranteeing produce is harvested in the early morning and delivered to consumer doorsteps on the same day.", bold_prefix="• ")
    add_bullet("Freshness Certification & Quality Transparency: Implement a rigorous daily quality inspection protocol where admins certify harvest timestamps, freshness scores (e.g. 98% crisp score), and Grade A+ ratings before dispatch.", bold_prefix="• ")
    add_bullet("Flexible Unit Management: Support custom fractional measurement units including kilograms, 500 grams, 250 grams, dozens, bunches, crates, and individual pieces with dynamic price recalculation.", bold_prefix="• ")
    add_bullet("Risk-Free Cash on Delivery (COD): Provide customer empowerment through COD, allowing customers to physically verify produce freshness at their doorstep before tendering payment.", bold_prefix="• ")
    add_bullet("Live 4-Stage Transparent Tracking: Deliver complete visual order fulfillment visibility across four granular stages: Order Confirmed, Order Packing & Inspected, Out for Delivery, and Delivered.", bold_prefix="• ")
    add_bullet("Fair Trade Farmer Empowerment: Provide regional growers with an inventory management portal to list produce directly, capture 85%+ retail margins, and build brand equity.", bold_prefix="• ")

    add_h2("2.3 Target User Community & Key Stakeholders")
    add_p("The FreshBasket ecosystem serves four primary stakeholder categories:")
    add_bullet("Urban Consumers & Households: Busy families, health-conscious individuals, working professionals, and culinary enthusiasts seeking crisp, nutrient-dense produce delivered reliably to their doorsteps.", bold_prefix="1. ")
    add_bullet("Local Farmers & Organic Growers: Regional agricultural producers seeking a modern direct-to-consumer digital marketplace with transparent inventory management and guaranteed daily demand.", bold_prefix="2. ")
    add_bullet("Store Administrators & Quality Managers: Platform operators responsible for catalog management, daily harvest quality certifications, inventory stock monitoring, order fulfillment pipelines, and customer feedback moderation.", bold_prefix="3. ")
    add_bullet("Delivery Couriers / Riders: Local fulfillment personnel utilizing route directions, customer delivery time slots, and special handling instructions to deliver produce in insulated containers and collect COD.", bold_prefix="4. ")

    add_h2("2.4 Project Boundaries, Inclusions, and Out-of-Scope Elements")
    add_p("To ensure engineering feasibility, rigorous academic delivery, and operational focus, system boundaries are established:")

    tbl_scope = doc.add_table(rows=6, cols=2)
    scope_headers = ["In-Scope Functional Modules (FreshBasket Core)", "Out-of-Scope / Excluded Functionality"]
    scope_data = [
        ["User registration, profile management, and multi-address book (Home, Office, etc.)", "International cross-border delivery and cold-chain air freight logistics"],
        ["Dynamic produce catalog with multi-criteria filtering (Category, Freshness, Organic, Price)", "Third-party payment gateways requiring international merchant credit card settlement (COD is the primary focus)"],
        ["Detailed product pages with nutritional analysis, harvest dates, farm origin, and storage tips", "Automated drone dispatch or automated robotic harvesting machinery integration"],
        ["Shopping basket with custom unit conversion, promo discounts, and delivery fee calculation", "B2B institutional bidding or wholesale futures derivative financial contracts"],
        ["Cash on Delivery (COD) checkout, automated receipts, and printable invoice vouchers", "Third-party multi-vendor dispute arbitration tribunals or civil court legal proceedings"],
    ]
    format_table(tbl_scope, [Inches(3.25), Inches(3.25)], scope_headers, scope_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_h2("2.5 High-Level Technological Architecture")
    add_p("FreshBasket leverages modern, standards-compliant web technologies designed for high performance, device responsiveness, zero latency, and seamless scalability:")
    add_bullet("Frontend Architecture: HTML5 semantic structure, modern CSS3 with Tailwind CSS utility framework, Lucide Iconography, and ECMAScript 6+ modular JavaScript with client-side reactive state management.", bold_prefix="• ")
    add_bullet("Backend Architecture: Node.js / Express RESTful API server with modular route controllers for products, orders, addresses, reviews, and quality inspection protocols.", bold_prefix="• ")
    add_bullet("Database Architecture: Relational Database Management System (MySQL / MariaDB / SQLite) normalized to Third Normal Form (3NF) ensuring strict ACID transactional compliance.", bold_prefix="• ")

    doc.add_page_break()

    # ==========================================================================
    # SECTION 3: FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS
    # ==========================================================================
    add_h1("3. Functional Requirements & Non-Functional Requirements")

    add_h2("3.1 Detailed Functional Requirements")
    add_p("The functional requirements of FreshBasket are systematically categorized into ten core functional modules:")

    add_h3("FR-01: User Registration, Authentication & Profile Administration")
    add_bullet("FR-01.1: The system shall allow new customers to create an account by providing their Full Name, Email Address, Mobile Phone Number, and a secure password.", bold_prefix="• ")
    add_bullet("FR-01.2: The system shall provide secure authentication (login and logout) with role-based session authorization distinguishing between 'Customer' and 'Administrator'.", bold_prefix="• ")
    add_bullet("FR-01.3: Customers shall be able to view and edit their profile information, update contact numbers, and view their comprehensive purchase order history.", bold_prefix="• ")

    add_h3("FR-02: Multi-Address Management & Delivery Location Routing")
    add_bullet("FR-02.1: The system shall allow customers to create, edit, and store multiple delivery addresses (e.g., 'Home', 'Office', 'Farmhouse').", bold_prefix="• ")
    add_bullet("FR-02.2: Each address record shall contain street address, building/house number, sector/area, city, and a dedicated contact telephone number.", bold_prefix="• ")
    add_bullet("FR-02.3: Customers shall be able to designate a 'Default Address' for rapid single-click checkout and toggle addresses during checkout.", bold_prefix="• ")

    add_h3("FR-03: Produce Catalog Navigation & Dynamic Multi-Criteria Filtering")
    add_bullet("FR-03.1: The system shall present an interactive marketplace catalog categorized into 'Fresh Fruits', 'Farm Vegetables', 'Leafy Greens', '100% Organic Certified', and 'Seasonal Harvest'.", bold_prefix="• ")
    add_bullet("FR-03.2: The catalog shall feature a real-time live search bar filtering products instantly by name, farm origin, or keywords without full-page reloads.", bold_prefix="• ")
    add_bullet("FR-03.3: The system shall provide multi-parameter filtering including Price Range Slider ($1 to $10+), Freshness Grade ('Grade A+ Picked Today', 'Grade A Crisp'), Organic Certification status, and In-Stock availability.", bold_prefix="• ")
    add_bullet("FR-03.4: Products shall be sortable by Featured/Freshness Score, Price (Low to High), Price (High to Low), Customer Rating, and Alphabetical order.", bold_prefix="• ")

    add_h3("FR-04: Detailed Product Specification, Nutritional Analysis & Farm Provenance")
    add_bullet("FR-04.1: Each produce item shall feature a dedicated product view with high-resolution multi-angle photography, botanical descriptions, and farm origin information.", bold_prefix="• ")
    add_bullet("FR-04.2: The system shall display verified grower provenance (Farmer Name, Orchard Location, and Harvest Timestamp such as 'Today, 5:30 AM').", bold_prefix="• ")
    add_bullet("FR-04.3: The system shall display a standardized Nutritional Breakdown panel per 100g (Calories, Carbohydrates, Dietary Fiber, Vitamin C, Iron, etc.).", bold_prefix="• ")
    add_bullet("FR-04.4: The system shall provide actionable Storage Recommendations (e.g., 'Refrigerate at 2°C - 4°C in crisper drawer; consume within 10 days').", bold_prefix="• ")

    add_h3("FR-05: Shopping Cart Engine & Flexible Measurement Unit Calculations")
    add_bullet("FR-05.1: The system shall allow customers to add produce to an interactive slide-over basket and select custom measurement units (e.g., 1 kg, 500g, 250g, 1 dozen, bunch, piece, or crate).", bold_prefix="• ")
    add_bullet("FR-05.2: The cart engine shall automatically recalculate fractional unit pricing dynamically based on chosen unit weights.", bold_prefix="• ")
    add_bullet("FR-05.3: Customers shall be able to increment/decrement quantities, remove items, and view subtotal, promotional discount, and delivery fee calculations.", bold_prefix="• ")
    add_bullet("FR-05.4: The cart shall validate item stock in real time, preventing users from exceeding currently available farm inventory.", bold_prefix="• ")

    add_h3("FR-06: Checkout Workflow, Delivery Slot Selection & Cash on Delivery (COD)")
    add_bullet("FR-06.1: The checkout process shall guide users through a streamlined multi-step flow: Select/Add Delivery Address, Select Delivery Time Slot, Enter Special Handling Notes, and Confirm COD.", bold_prefix="• ")
    add_bullet("FR-06.2: The system shall allow customers to select preferred express delivery slots (e.g., 'Today Evening 4:00 PM - 6:00 PM', 'Tomorrow Morning 8:00 AM - 11:00 AM').", bold_prefix="• ")
    add_bullet("FR-06.3: Customers shall be able to record special handling instructions (e.g., 'Please pack ripe mangoes separately, ring doorbell twice and leave on doorstep table').", bold_prefix="• ")
    add_bullet("FR-06.4: The system shall support Cash on Delivery (COD) as the primary payment method, generating an automated order confirmation voucher and printable receipt.", bold_prefix="• ")

    add_h3("FR-07: Real-Time 4-Stage Order Tracking & Dispatch Radar")
    add_bullet("FR-07.1: Customers shall be able to track orders in real time via a unique Order ID (e.g. #FB-88219) through four visual stages: 1. Confirmed, 2. Quality Packed, 3. Out for Delivery, 4. Delivered.", bold_prefix="• ")
    add_bullet("FR-07.2: Each stage shall display dynamic completion timestamps and color-coded visual progress indicators.", bold_prefix="• ")
    add_bullet("FR-07.3: The tracking portal shall display assigned insulated-van courier details (Rider Name, Rider Phone, Delivery Rating) and recorded delivery notes.", bold_prefix="• ")

    add_h3("FR-08: Farm-to-Fork Quality Check Protocol & Freshness Certification")
    add_bullet("FR-08.1: Administrators shall have access to a Quality Inspection Hub to certify incoming morning farm batches before produce is dispatched.", bold_prefix="• ")
    add_bullet("FR-08.2: Admins shall record batch harvest timestamps, assign Freshness Scores (0% to 100%), and certify Grade status (Grade A+ Farm Fresh, Grade A Crisp, etc.).", bold_prefix="• ")
    add_bullet("FR-08.3: The system shall provide a 'Batch Quality Audit' trigger to simultaneously update certifications across all active produce lines.", bold_prefix="• ")

    add_h3("FR-09: Customer Reviews, Dual-Dimensional Ratings & Photo Uploads")
    add_bullet("FR-09.1: Verified buyers shall be able to submit customer reviews containing general star ratings (1 to 5) and specialized Freshness Ratings (1 to 5).", bold_prefix="• ")
    add_bullet("FR-09.2: Customers shall be able to upload photographs of the delivered produce showcasing doorstep condition.", bold_prefix="• ")
    add_bullet("FR-09.3: Administrators shall be able to moderate customer reviews and publish official farm responses visible directly under the customer comment.", bold_prefix="• ")

    add_h3("FR-10: Administrator Management Center & Inventory Stock Control")
    add_bullet("FR-10.1: The Admin Control Center shall display real-time Key Performance Indicators (Total Revenue, Active Orders, Low Stock Alerts, Average Freshness Score).", bold_prefix="• ")
    add_bullet("FR-10.2: Admins shall be able to Add, Edit, and Delete produce items, specifying titles, categories, units, prices, stock levels, organic tags, and farm origins.", bold_prefix="• ")
    add_bullet("FR-10.3: The system shall automatically flag low-stock items (< 5 units) with high-visibility alert badges.", bold_prefix="• ")
    add_bullet("FR-10.4: Admins shall possess the capability to update customer order fulfillment stages directly (advancing orders from Confirmed through Delivered).", bold_prefix="• ")

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_h2("3.2 Comprehensive Non-Functional Requirements")
    add_p("Non-functional requirements specify the operational quality standards, architectural constraints, and performance baselines governing system reliability:")

    tbl_nfr = doc.add_table(rows=6, cols=3)
    nfr_headers = ["NFR Identifier", "Quality Attribute", "Verifiable Engineering Specification"]
    nfr_data = [
        ["NFR-01: Performance & Latency", "System Response Time", "Page load time for the marketplace shall not exceed 1.5 seconds on standard broadband connections. Live search and client-side filtering operations shall execute in under 100 milliseconds."],
        ["NFR-02: Security & Integrity", "Authentication & Data Protection", "All customer passwords shall be securely hashed using salted bcrypt / PBKDF2 algorithms. Cross-Site Scripting (XSS) and SQL Injection prevention mechanisms shall sanitize all user inputs."],
        ["NFR-03: Availability & Reliability", "Uptime & Fault Resilience", "The platform shall maintain 99.9% uptime during peak morning ordering windows (6:00 AM to 11:00 AM). LocalStorage and transactional fallbacks shall prevent cart loss during transient network disconnects."],
        ["NFR-04: Usability & UI/UX", "Human Interface Guidelines", "The user interface shall adhere to mobile-first responsive design principles, supporting viewport widths from 360px (mobile smartphones) to 1920px (desktop monitors). Touch targets shall exceed 44x44 pixels."],
        ["NFR-05: Maintainability & Portability", "Architectural Modularity", "The software shall be architected with clear separation of concerns (MVC / REST API). Frontend and backend components shall execute portably across modern operating systems (Linux, Windows, macOS) and web browsers."]
    ]
    format_table(tbl_nfr, [Inches(1.8), Inches(1.6), Inches(3.1)], nfr_headers, nfr_data)

    doc.add_page_break()

    # ==========================================================================
    # SECTION 4: USE CASE DIAGRAM & SPECIFICATIONS
    # ==========================================================================
    add_h1("4. Use Case Diagram")

    add_h2("4.1 System Actors & Operational Roles")
    add_p("The FreshBasket system behavior is defined by interactions between three primary actors:")
    add_bullet("Customer (Primary Consumer): An end-user who interacts with the storefront to browse produce, filter by freshness/price, view farm origins and nutritional data, add items to cart in custom units, checkout via Cash on Delivery, track fulfillment stages, and submit photo reviews.", bold_prefix="1. ")
    add_bullet("Administrator (Store Manager / Quality Inspector): An authorized system operator who manages catalog items, executes daily harvest quality certifications, monitors inventory stock, advances order stages, and moderates customer feedback.", bold_prefix="2. ")
    add_bullet("Delivery Staff (Courier Rider): Fulfillment logistics personnel who access assigned customer delivery addresses, view special handling instructions, deliver produce in temperature-insulated containers, collect cash payment, and confirm delivery completion.", bold_prefix="3. ")

    add_h2("4.2 High-Resolution Architectural Use Case Diagram")
    add_p("The diagram below illustrates all system use cases enclosed within the FreshBasket system boundary, displaying actor associations, <<include>> dependencies, and <<extend>> relationships.")

    add_image_figure("diagrams/use_case_diagram.png", "FreshBasket System Architecture - UML Use Case Diagram", width=Inches(6.4))

    add_h2("4.3 Core Use Case Specifications (Tabular Execution Scenarios)")
    add_p("Below are formal tabular behavioral specifications for the primary operational use cases of FreshBasket:")

    # Use Case 1: Place Order via COD
    add_h3("Use Case UC-01: Place Farm-Fresh Order via Cash on Delivery (COD)")
    uc1_tbl = doc.add_table(rows=8, cols=2)
    uc1_data = [
        ["Use Case ID & Name", "UC-01: Place Produce Order via Cash on Delivery (COD)"],
        ["Primary Actor", "Customer"],
        ["Preconditions", "Customer has selected at least one fresh produce item in the shopping basket."],
        ["Trigger", "Customer clicks 'Proceed to Checkout' in the shopping cart drawer."],
        ["Main Success Scenario (Flow of Events)", "1. System opens Checkout modal and displays saved addresses.\n2. Customer selects existing address or enters new address.\n3. Customer selects preferred delivery time slot (e.g. Today 4:00 PM - 6:00 PM).\n4. Customer enters special handling instructions (e.g., 'Ripe mangoes, ring bell twice').\n5. System validates payment method as Cash on Delivery (COD).\n6. Customer clicks 'Confirm & Place Order'.\n7. System deducts product stock from inventory, generates unique Order ID (#FB-XXXXX), creates order record, clears cart, and displays automated confirmation voucher."],
        ["Extensions / Alternative Flows", "4a. Customer enters new address: System validates street, city, and phone number, saving record to address book.\n6a. Stock runs out during checkout: System alerts customer of out-of-stock item and updates cart."],
        ["Postconditions", "Order is stored with 'Confirmed' status; stock is decremented; automated confirmation voucher is rendered."]
    ]
    format_table(uc1_tbl, [Inches(2.0), Inches(4.5)], ["Specification Attribute", "Operational Details"], uc1_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Use Case 2: Track Live Order
    add_h3("Use Case UC-02: Track 4-Stage Live Order Fulfillment")
    uc2_tbl = doc.add_table(rows=8, cols=2)
    uc2_data = [
        ["Use Case ID & Name", "UC-02: Track 4-Stage Live Order Fulfillment"],
        ["Primary Actor", "Customer / Administrator"],
        ["Preconditions", "A valid order has been placed in the system with an assigned Order ID."],
        ["Trigger", "Customer clicks 'Track Order Status' on the receipt modal or navigates to Order Tracker."],
        ["Main Success Scenario (Flow of Events)", "1. System retrieves order record using Order ID.\n2. System renders 4-Stage Visual Timeline: Confirmed -> Quality Packed -> Out for Delivery -> Delivered.\n3. System computes progress bar percentage (0%, 33%, 66%, 100%) and highlights active node with pulsing glow.\n4. System displays assigned courier details (Name, vehicle, telephone contact, customer rating).\n5. System displays destination address, special handling instructions, and itemized bill summary."],
        ["Extensions / Alternative Flows", "1a. Customer searches invalid Order ID: System displays error alert prompt."],
        ["Postconditions", "Customer gains real-time transparency of delivery progress and courier contact information."]
    ]
    format_table(uc2_tbl, [Inches(2.0), Inches(4.5)], ["Specification Attribute", "Operational Details"], uc2_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Use Case 3: Conduct Quality Inspection
    add_h3("Use Case UC-03: Conduct Daily Farm-to-Fork Quality Inspection")
    uc3_tbl = doc.add_table(rows=8, cols=2)
    uc3_data = [
        ["Use Case ID & Name", "UC-03: Conduct Daily Farm-to-Fork Quality Inspection & Freshness Certification"],
        ["Primary Actor", "Administrator (Quality Assurance Manager)"],
        ["Preconditions", "Administrator is logged in with administrative privileges."],
        ["Trigger", "Admin opens Admin Control Center and navigates to 'Quality Inspection Log' tab."],
        ["Main Success Scenario (Flow of Events)", "1. System displays list of active produce items with current harvest timestamps and freshness scores.\n2. Admin inspects daily morning harvest batch.\n3. Admin clicks 'Re-Certify' for a specific item or 'Run All Quality Certifications' for batch audit.\n4. System updates produce freshness grade to 'Grade A+ (Picked Today)', freshness score to 98%+, and records current inspection timestamp.\n5. System propagates certified quality status across storefront product cards immediately."],
        ["Extensions / Alternative Flows", "3a. Produce fails quality inspection: Admin updates stock to 0 or marks item as 'Discount Peak Ripeness'."],
        ["Postconditions", "Produce freshness ratings are certified; harvest timestamps and audit records are updated."]
    ]
    format_table(uc3_tbl, [Inches(2.0), Inches(4.5)], ["Specification Attribute", "Operational Details"], uc3_data)

    doc.add_page_break()

    # ==========================================================================
    # SECTION 5: WORK PLAN (GANTT CHART)
    # ==========================================================================
    add_h1("5. Work Plan (Gantt Chart)")

    add_h2("5.1 Work Breakdown Structure (WBS) & Lifecycle Phases")
    add_p("The development of FreshBasket is organized across an 18-week project lifecycle divided into six distinct engineering phases. The Work Breakdown Structure ensures systematic progression from requirements gathering to final deployment:")
    add_bullet("Phase 1: Project Proposal & Requirement Specification (Weeks 1 - 3): Problem statement formulation, domain literature review, stakeholder interview, and completion of the formal SRS First Deliverable document.", bold_prefix="• ")
    add_bullet("Phase 2: System Architecture & Relational Modeling (Weeks 4 - 6): Behavioral use case modeling, conceptual and logical data modeling, Crow's foot ERD formulation, and 3NF relational database schema design.", bold_prefix="• ")
    add_bullet("Phase 3: UI/UX Wireframing & Design System Prototyping (Weeks 6 - 9): Responsive layout design, color system formulation, typography hierarchy, high-fidelity component wireframes, and design testing.", bold_prefix="• ")
    add_bullet("Phase 4: Core Implementation & API Development (Weeks 8.5 - 14): Frontend client implementation, REST API endpoints, cart engine, Cash on Delivery checkout, 4-stage live tracking, and Admin Quality Hub.", bold_prefix="• ")
    add_bullet("Phase 5: System Integration & Quality Assurance Testing (Weeks 13.5 - 16): Integration testing, cross-browser compatibility testing, mobile responsiveness verification, performance tuning, and User Acceptance Testing (UAT).", bold_prefix="• ")
    add_bullet("Phase 6: Deployment, Final Documentation & Presentation (Weeks 15.5 - 18): Production build deployment, comprehensive final project report compilation, video demonstration, and final viva examination defense.", bold_prefix="• ")

    add_h2("5.2 Milestone Deliverables & Timeline Schedule")
    add_p("The table below details the project milestones, duration, and scheduled completion deadlines:")

    tbl_gantt_data = doc.add_table(rows=7, cols=4)
    gantt_headers = ["Phase / Milestone Identifier", "Description of Phase Deliverable", "Timeline (Weeks)", "Target Milestone Deadline"]
    gantt_rows = [
        ["Milestone 1 (M1)", "Project Proposal, SRS & First Deliverable Document", "Weeks 1 - 3", "Week 3 End (Current Deliverable)"],
        ["Milestone 2 (M2)", "UML Models, ERD & Normalized Database Schemas", "Weeks 4 - 6", "Week 6 End"],
        ["Milestone 3 (M3)", "Responsive UI/UX Wireframes & Component System", "Weeks 6 - 9", "Week 9 End"],
        ["Milestone 4 (M4)", "Functional Prototype (Marketplace, Cart, Tracking, Admin)", "Weeks 8.5 - 14", "Week 14 End"],
        ["Milestone 5 (M5)", "Integration, Quality Assurance & Security Audit", "Weeks 13.5 - 16", "Week 16 End"],
        ["Milestone 6 (M6)", "Final Comprehensive Report, Live Hosting & Viva Defense", "Weeks 15.5 - 18", "Week 18 End"]
    ]
    format_table(tbl_gantt_data, [Inches(1.5), Inches(2.5), Inches(1.2), Inches(1.3)], gantt_headers, gantt_rows)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_h2("5.3 High-Resolution Project Gantt Chart")
    add_p("The figure below presents the comprehensive Gantt Chart for the FreshBasket project lifecycle, illustrating phase durations, overlapping sprint schedules, and milestone delivery markers:")

    add_image_figure("diagrams/work_plan_gantt.png", "FreshBasket Project Work Plan & Gantt Chart Schedule (Weeks 1 - 18)", width=Inches(6.4))

    doc.add_page_break()

    # ==========================================================================
    # SECTION 6: ENTITY RELATIONSHIP DIAGRAM (ERD)
    # ==========================================================================
    add_h1("6. Entity Relationship Diagram (ERD)")

    add_h2("6.1 Conceptual Data Model & Cardinality Logic")
    add_p("The conceptual data model of FreshBasket is engineered using standard Crow's Foot notation. The architecture represents the persistent entities, operational attributes, primary keys (PK), foreign keys (FK), and relationship cardinalities governing the marketplace:")
    add_bullet("One-to-Many (1 : N) USERS to ADDRESSES: A single user entity can register zero or multiple delivery addresses (e.g. Home, Office), while each address record is strictly associated with exactly one user.", bold_prefix="• ")
    add_bullet("One-to-Many (1 : N) USERS to ORDERS: A customer user can place zero or multiple orders over time; each order is linked to exactly one user.", bold_prefix="• ")
    add_bullet("One-to-Many (1 : N) ADDRESSES to ORDERS: A delivery address can serve as the destination for multiple historical orders; each order references exactly one delivery address.", bold_prefix="• ")
    add_bullet("One-to-Many (1 : N) CATEGORIES to PRODUCTS: A produce category contains one or many distinct produce items; each product belongs to exactly one category.", bold_prefix="• ")
    add_bullet("One-to-Many (1 : N) ORDERS to ORDER_ITEMS: An order is composed of one or many item line records; each order item entry belongs to exactly one parent order.", bold_prefix="• ")
    add_bullet("One-to-Many (1 : N) PRODUCTS to ORDER_ITEMS: A produce item can appear across multiple order items; each order item references exactly one produce entity.", bold_prefix="• ")
    add_bullet("One-to-Many (1 : N) PRODUCTS to QUALITY_CHECKS: A produce item is subject to multiple daily quality inspection records; each inspection record certifies exactly one produce item.", bold_prefix="• ")
    add_bullet("One-to-Many (1 : N) PRODUCTS to REVIEWS: A produce item accumulates multiple customer reviews; each review is linked to one product and one verified customer.", bold_prefix="• ")

    add_h2("6.2 High-Resolution Entity Relationship Diagram (Crow's Foot)")
    add_p("The diagram below illustrates the complete Entity Relationship Diagram (ERD) of FreshBasket, detailing all eight relational entities, attributes, primary/foreign keys, and cardinality links:")

    add_image_figure("diagrams/erd_diagram.png", "FreshBasket Complete Entity Relationship Diagram (ERD - Crow's Foot Notation)", width=Inches(6.4))

    add_h2("6.3 Detailed Entity Dictionary & Attribute Specifications")
    add_p("The entity dictionary defines the operational semantics and integrity roles of each entity in the system:")

    tbl_ent_dict = doc.add_table(rows=9, cols=3)
    dict_headers = ["Entity Name", "Primary Key & Foreign Keys", "Business Role & Semantic Purpose"]
    dict_rows = [
        ["USERS", "PK: user_id\nFK: None", "Stores registered customer and administrator accounts, hashed credentials, contact information, and role authorization flags."],
        ["ADDRESSES", "PK: address_id\nFK: user_id", "Maintains multiple customer delivery destinations, street coordinates, area landmarks, city names, and default routing flags."],
        ["CATEGORIES", "PK: category_id\nFK: None", "Classifies produce into hierarchical groups (Fruits, Vegetables, Leafy Greens, Organic, Seasonal) for catalog navigation."],
        ["PRODUCTS", "PK: product_id\nFK: category_id", "Stores fruit and vegetable catalog details, pricing, default unit types, stock levels, freshness grades, farm origin, and storage advice."],
        ["ORDERS", "PK: order_id\nFK: user_id, address_id", "Captures customer order placements, financial subtotals, Cash on Delivery status, 4-stage fulfillment stage, and handling notes."],
        ["ORDER_ITEMS", "PK: order_item_id\nFK: order_id, product_id", "Maintains itemized order line entries, recording chosen unit name, unit price at purchase time, quantity, and line subtotal."],
        ["QUALITY_CHECKS", "PK: check_id\nFK: product_id, inspector_id", "Logs daily farm-to-fork quality audits, recording batch codes, freshness scores (0-100%), grades assigned, and harvest dates."],
        ["REVIEWS", "PK: review_id\nFK: product_id, user_id", "Captures verified customer feedback, dual star ratings (overall and freshness), review comments, photo URLs, and admin responses."]
    ]
    format_table(tbl_ent_dict, [Inches(1.5), Inches(1.8), Inches(3.2)], dict_headers, dict_rows)

    doc.add_page_break()

    # ==========================================================================
    # SECTION 7: DATABASE DESIGN
    # ==========================================================================
    add_h1("7. Database Design")

    add_h2("7.1 Physical Relational Schema Architecture & Normalization")
    add_p("The relational database architecture of FreshBasket is engineered in strict compliance with Third Normal Form (3NF) relational design principles. The normalization analysis ensures the database is free of update, insertion, and deletion anomalies:")
    add_bullet("First Normal Form (1NF): All table columns store atomic, indivisible values. Repeating groups and multi-valued attributes have been eliminated (e.g. multiple addresses are normalized into a dedicated tbl_addresses table; multiple order items are normalized into tbl_order_items).", bold_prefix="• ")
    add_bullet("Second Normal Form (2NF): All tables satisfy 1NF, and all non-key attributes are fully functionally dependent on the entire primary key. In composite junction tables such as tbl_order_items, surrogate primary keys (order_item_id) eliminate partial dependency risks.", bold_prefix="• ")
    add_bullet("Third Normal Form (3NF): All tables satisfy 2NF, and no transitive functional dependencies exist (no non-key attribute depends on another non-key attribute). For instance, farm origin and harvest details are encapsulated within tbl_products rather than being duplicated inside order transaction records.", bold_prefix="• ")

    add_h2("7.2 Physical Relational Schema Diagram")
    add_p("The diagram below illustrates the physical relational schema mapping, showing table column definitions, data types, nullability constraints, and primary/foreign key connections:")

    add_image_figure("diagrams/database_schema.png", "FreshBasket Physical Relational Database Schema Architecture", width=Inches(6.4))

    add_h2("7.3 Complete Database Table Specifications (Data Dictionaries)")
    add_p("Below are the complete, detailed database dictionaries for all eight production relational tables:")

    # Table 1: tbl_users
    add_h3("Table 1: tbl_users (Customer & Administrator Accounts)")
    t1 = doc.add_table(rows=8, cols=6)
    t1_headers = ["Column Name", "Data Type", "Null", "Key", "Default", "Description"]
    t1_data = [
        ["user_id", "INT UNSIGNED", "No", "PK", "AUTO_INCREMENT", "Unique surrogate identifier for user account"],
        ["full_name", "VARCHAR(100)", "No", "", "None", "User's full legal name"],
        ["email", "VARCHAR(120)", "No", "UQ", "None", "Unique email address for login credentials"],
        ["password_hash", "VARCHAR(255)", "No", "", "None", "Securely hashed user password string"],
        ["phone_number", "VARCHAR(20)", "No", "", "None", "Primary contact phone for delivery courier coordination"],
        ["role", "ENUM('cust','adm')", "No", "", "'cust'", "Role-based authorization ('cust' or 'adm')"],
        ["created_at", "DATETIME", "No", "", "CURRENT_TIMESTAMP", "Timestamp of account registration"]
    ]
    format_table(t1, [Inches(1.2), Inches(1.1), Inches(0.5), Inches(0.5), Inches(1.2), Inches(2.0)], t1_headers, t1_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Table 2: tbl_addresses
    add_h3("Table 2: tbl_addresses (Multiple Customer Delivery Locations)")
    t2 = doc.add_table(rows=9, cols=6)
    t2_data = [
        ["address_id", "INT UNSIGNED", "No", "PK", "AUTO_INCREMENT", "Unique identifier for address entry"],
        ["user_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing tbl_users(user_id)"],
        ["label", "VARCHAR(50)", "No", "", "'Home'", "Friendly location label (e.g. Home, Office)"],
        ["street_address", "TEXT", "No", "", "None", "Full street address, building, and house number"],
        ["area", "VARCHAR(100)", "Yes", "", "NULL", "Sub-locality, phase, or sector name"],
        ["city", "VARCHAR(50)", "No", "", "'Lahore'", "City name for delivery logistics hub"],
        ["phone", "VARCHAR(20)", "No", "", "None", "On-site contact telephone for doorstep courier"],
        ["is_default", "TINYINT(1)", "No", "", "0", "Boolean flag indicating default checkout selection"]
    ]
    format_table(t2, [Inches(1.2), Inches(1.1), Inches(0.5), Inches(0.5), Inches(1.2), Inches(2.0)], t1_headers, t2_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Table 3: tbl_categories
    add_h3("Table 3: tbl_categories (Produce Classification Groups)")
    t3 = doc.add_table(rows=6, cols=6)
    t3_data = [
        ["category_id", "INT UNSIGNED", "No", "PK", "AUTO_INCREMENT", "Unique identifier for produce category"],
        ["name", "VARCHAR(60)", "No", "UQ", "None", "Category name (Fruits, Vegetables, Leafy Greens)"],
        ["slug", "VARCHAR(60)", "No", "UQ", "None", "URL-friendly category slug"],
        ["description", "TEXT", "Yes", "", "NULL", "Descriptive overview of category items"],
        ["is_active", "TINYINT(1)", "No", "", "1", "Active status toggle for category visibility"]
    ]
    format_table(t3, [Inches(1.2), Inches(1.1), Inches(0.5), Inches(0.5), Inches(1.2), Inches(2.0)], t1_headers, t3_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Table 4: tbl_products
    add_h3("Table 4: tbl_products (Produce Catalog & Freshness Metadata)")
    t4 = doc.add_table(rows=14, cols=6)
    t4_data = [
        ["product_id", "INT UNSIGNED", "No", "PK", "AUTO_INCREMENT", "Unique produce item identifier"],
        ["category_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing tbl_categories(category_id)"],
        ["name", "VARCHAR(120)", "No", "", "None", "Commercial name of produce item"],
        ["unit_type", "VARCHAR(30)", "No", "", "'1 kg'", "Default measurement unit (kg, dozen, bunch, piece)"],
        ["unit_price", "DECIMAL(10,2)", "No", "", "None", "Base retail price per unit in USD/PKR"],
        ["stock_quantity", "INT", "No", "", "0", "Available inventory quantity in stock"],
        ["freshness_grade", "VARCHAR(40)", "No", "", "'Grade A'", "Certified grade (e.g. Grade A+ Picked Today)"],
        ["freshness_score", "INT", "No", "", "95", "Calculated freshness percentage score (0-100)"],
        ["is_organic", "TINYINT(1)", "No", "", "0", "Boolean flag for certified organic produce"],
        ["is_seasonal", "TINYINT(1)", "No", "", "0", "Boolean flag indicating seasonal harvest item"],
        ["farm_origin", "VARCHAR(150)", "No", "", "None", "Grower orchard, farm name, and geographic region"],
        ["image_url", "VARCHAR(255)", "No", "", "None", "High-resolution produce photography URL"],
        ["storage_tips", "TEXT", "Yes", "", "NULL", "Recommended kitchen refrigeration and storage advice"]
    ]
    format_table(t4, [Inches(1.2), Inches(1.1), Inches(0.5), Inches(0.5), Inches(1.2), Inches(2.0)], t1_headers, t4_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Table 5: tbl_orders
    add_h3("Table 5: tbl_orders (Customer Transactions & Cash on Delivery)")
    t5 = doc.add_table(rows=12, cols=6)
    t5_data = [
        ["order_id", "INT UNSIGNED", "No", "PK", "AUTO_INCREMENT", "Unique internal transaction identifier"],
        ["user_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing tbl_users(user_id)"],
        ["address_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing tbl_addresses(address_id)"],
        ["order_number", "VARCHAR(30)", "No", "UQ", "None", "Public formatted tracking code (e.g. #FB-88219)"],
        ["subtotal", "DECIMAL(10,2)", "No", "", "0.00", "Gross item price subtotal"],
        ["delivery_fee", "DECIMAL(10,2)", "No", "", "0.00", "Express delivery fee (0.00 if free threshold)"],
        ["total_amount", "DECIMAL(10,2)", "No", "", "None", "Net payable cash amount at doorstep"],
        ["payment_type", "VARCHAR(30)", "No", "", "'COD'", "Payment method identifier (Cash on Delivery)"],
        ["order_status", "ENUM", "No", "", "'Confirmed'", "Fulfillment stage ('Confirmed','Packing','Out','Delivered')"],
        ["delivery_slot", "VARCHAR(60)", "No", "", "None", "Selected express delivery window"],
        ["special_notes", "TEXT", "Yes", "", "NULL", "Customer handling instructions for delivery courier"]
    ]
    format_table(t5, [Inches(1.2), Inches(1.1), Inches(0.5), Inches(0.5), Inches(1.2), Inches(2.0)], t1_headers, t5_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Table 6: tbl_order_items
    add_h3("Table 6: tbl_order_items (Itemized Produce Line Entries)")
    t6 = doc.add_table(rows=8, cols=6)
    t6_data = [
        ["order_item_id", "INT UNSIGNED", "No", "PK", "AUTO_INCREMENT", "Unique identifier for order item row"],
        ["order_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing parent tbl_orders(order_id)"],
        ["product_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing tbl_products(product_id)"],
        ["unit_name", "VARCHAR(30)", "No", "", "None", "Selected unit variant (e.g. 500g, 1 kg, 1 dozen)"],
        ["unit_price", "DECIMAL(10,2)", "No", "", "None", "Effective unit price applied at order time"],
        ["quantity", "INT UNSIGNED", "No", "", "1", "Purchased count of selected unit variant"],
        ["subtotal", "DECIMAL(10,2)", "No", "", "None", "Calculated line subtotal (quantity * unit_price)"]
    ]
    format_table(t6, [Inches(1.2), Inches(1.1), Inches(0.5), Inches(0.5), Inches(1.2), Inches(2.0)], t1_headers, t6_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Table 7: tbl_quality_checks
    add_h3("Table 7: tbl_quality_checks (Daily Farm-to-Fork Quality Audit Log)")
    t7 = doc.add_table(rows=9, cols=6)
    t7_data = [
        ["check_id", "INT UNSIGNED", "No", "PK", "AUTO_INCREMENT", "Unique quality inspection log ID"],
        ["product_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing tbl_products(product_id)"],
        ["inspector_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing tbl_users(user_id)"],
        ["batch_code", "VARCHAR(50)", "No", "", "None", "Daily harvest batch identifier (e.g. BATCH-2026-OCT)"],
        ["freshness_score", "INT", "No", "", "100", "Audited freshness percentage rating (0 - 100)"],
        ["grade_assigned", "VARCHAR(30)", "No", "", "'Grade A+'", "Certified quality status grade"],
        ["harvest_time", "DATETIME", "No", "", "None", "Recorded morning harvest timestamp from orchard"],
        ["inspection_time", "DATETIME", "No", "", "CURRENT_TIMESTAMP", "Timestamp when inspector certified produce batch"]
    ]
    format_table(t7, [Inches(1.2), Inches(1.1), Inches(0.5), Inches(0.5), Inches(1.2), Inches(2.0)], t1_headers, t7_data)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Table 8: tbl_reviews
    add_h3("Table 8: tbl_reviews (Customer Feedback, Star Ratings & Photos)")
    t8 = doc.add_table(rows=10, cols=6)
    t8_data = [
        ["review_id", "INT UNSIGNED", "No", "PK", "AUTO_INCREMENT", "Unique customer review identifier"],
        ["product_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing tbl_products(product_id)"],
        ["user_id", "INT UNSIGNED", "No", "FK", "None", "Foreign key referencing tbl_users(user_id)"],
        ["rating_stars", "TINYINT UNSIGNED", "No", "", "5", "Overall satisfaction star rating (1 to 5)"],
        ["freshness_stars", "TINYINT UNSIGNED", "No", "", "5", "Specific produce freshness rating (1 to 5)"],
        ["comment_text", "TEXT", "No", "", "None", "Customer narrative regarding texture, crunch, aroma"],
        ["photo_url", "VARCHAR(255)", "Yes", "", "NULL", "URL of customer photo uploaded upon delivery"],
        ["seller_response", "TEXT", "Yes", "", "NULL", "Official farm/store administrator reply"],
        ["created_at", "DATETIME", "No", "", "CURRENT_TIMESTAMP", "Timestamp when customer published feedback"]
    ]
    format_table(t8, [Inches(1.2), Inches(1.1), Inches(0.5), Inches(0.5), Inches(1.2), Inches(2.0)], t1_headers, t8_data)

    doc.add_page_break()

    # ==========================================================================
    # SECTION 8: INTERFACE DESIGN
    # ==========================================================================
    add_h1("8. Interface Design")

    add_h2("8.1 User Interface Design Philosophy & Visual System")
    add_p("The interface design of FreshBasket embodies human-centered design principles tailored for modern e-commerce. Built using modern Tailwind CSS and semantic component architecture, the visual system incorporates:")
    add_bullet("Appetizing Natural Color Palette: Primary branding employs organic forest and emerald greens (#14532D, #16A34A, #22C55E) symbolizing crisp harvest freshness, complemented by warm amber (#F59E0B) for Cash on Delivery highlights and seasonal badges.", bold_prefix="• ")
    add_bullet("Typographic Hierarchy: Clean sans-serif typography utilizing 'Outfit' for striking commercial headings and 'Plus Jakarta Sans' for legible body copy, metadata, and nutritional data tables.", bold_prefix="• ")
    add_bullet("Immediate Visual Feedback: Micro-interactions, dynamic cart badge counters, animated timeline radar pulses, and unobtrusive toast notifications confirm all user actions without disruptive page reloads.", bold_prefix="• ")
    add_bullet("Multi-Modal Interaction: Seamless overlay drawers and modals allow users to inspect product provenance, customize measurement units, manage multiple addresses, and track shipments while maintaining contextual orientation in the marketplace.", bold_prefix="• ")

    add_p("Below are detailed descriptions and high-resolution graphical screenshots of the five core user interfaces built for the FreshBasket platform:")

    # GUI 1
    add_h2("8.2 GUI Interface 1: Customer Storefront & Dynamic Multi-Filter Catalog")
    add_p("The storefront represents the primary landing interface for consumers. It features an announcement banner for morning harvests, brand header, live search bar with keyboard shortcut (⌘K), delivery hub selector, quick category strip (All, Fruits, Vegetables, Leafy Greens, Organic, Seasonal), hero showcase with trust badges, and the interactive product catalog.")
    add_p("The left sidebar provides multi-criteria filtering controls (Category selection, Freshness status checkboxes, Organic/Seasonal tags, and an interactive Price Slider from $1.00 to $10.00). Each product card renders vibrant produce photography, freshness grade badge (e.g. 'Grade A+ Picked Today'), farm origin, customer rating, price per unit, remaining stock indicator, and instant 'Add to Basket' button.")

    add_image_figure("screenshots/gui_1_storefront.png", "GUI Interface 1: FreshBasket Customer Storefront & Multi-Filter Catalog", width=Inches(6.3))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # GUI 2
    add_h2("8.3 GUI Interface 2: Dynamic Product Detail & Farm Freshness Modal")
    add_p("Clicking on any produce item opens the dedicated Product Detail Modal. This interface displays high-resolution multi-angle photography alongside verified farm provenance (Grower Name, Farm Location, Harvest Timestamp, and Certified Freshness Score).")
    add_p("Crucially, this interface features a Nutritional Breakdown panel per 100g (Calories, Carbs, Fiber, Vitamin C), actionable Storage and Handling recommendations, and an interactive Measurement Unit Selector (e.g., 1 kg, 500g, 2 kg Pack) that dynamically recalculates prices in real time. Below, customer reviews with verified purchase tags, freshness star ratings, and review photos provide social proof.")

    add_image_figure("screenshots/gui_2_product_detail.png", "GUI Interface 2: Dynamic Product Detail, Nutritional Facts & Harvest Provenance Modal", width=Inches(6.3))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # GUI 3
    add_h2("8.4 GUI Interface 3: Interactive Shopping Basket & Cash-on-Delivery Checkout Flow")
    add_p("The shopping basket slide-over drawer displays all selected items with thumbnails, chosen measurement units, unit prices, quantity increment/decrement controls, item removal buttons, promotional coupon code applicator ('FRESH20' for 20% off), delivery fee calculation ($2.50 or FREE over $20), and subtotal breakdown.")
    add_p("Clicking 'Proceed to Checkout' triggers the multi-step checkout modal. Here, the customer selects from their saved delivery addresses (or clicks '+ Add New Address' to enter street, area, and contact phone), selects preferred express delivery time slots (Today Evening, Tonight, Tomorrow Morning Harvest), enters special delivery notes (e.g., 'Ring bell twice and leave in cool shade'), and reviews Cash on Delivery (COD) terms before final confirmation.")

    add_image_figure("screenshots/gui_3_checkout_flow.png", "GUI Interface 3: Interactive Multi-Step Checkout Modal & Cash on Delivery (COD) Engine", width=Inches(6.3))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # GUI 4
    add_h2("8.5 GUI Interface 4: Live Visual 4-Stage Order Tracking Portal")
    add_p("Upon placing an order (or searching an Order ID such as #FB-88219), the dedicated Order Tracking Portal renders a real-time 4-stage visual timeline: 1. Confirmed, 2. Quality Packed, 3. Out for Delivery, and 4. Delivered. A dynamic green progress bar connects each milestone with timestamps and pulsing radar glows.")
    add_p("The interface displays courier details (Insulated Van Driver Hamza Tariq, customer rating 4.9, telephone hotline), destination address, special handling instructions, and an itemized breakdown of all produce in the shipment. An integrated simulation control panel allows evaluators to simulate real-time stage progression dynamically.")

    add_image_figure("screenshots/gui_4_order_tracker.png", "GUI Interface 4: Live 4-Stage Order Tracking Portal & Courier Fulfillment Radar", width=Inches(6.3))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # GUI 5
    add_h2("8.6 GUI Interface 5: Admin Control Center & Freshness Quality Inspection Dashboard")
    add_p("The Admin Control Center provides store operators with an executive command center. Top stat cards display real-time Key Performance Indicators: Total Revenue, Active Orders, Low Stock Alerts (< 5 units), and Average Produce Freshness (98.6%).")
    add_p("Four interactive tabs govern operational workflows: (1) 'Products & Inventory' allows admins to add, edit, or delete produce lines; (2) 'Order Dispatching & Stages' provides dropdown selectors to advance customer orders from Confirmed through Delivered; (3) 'Quality Inspection Log' allows quality managers to certify morning batches, assign freshness scores, and update harvest dates; and (4) 'Customer Reviews Moderation' enables admins to review customer comments and publish official farm responses.")

    add_image_figure("screenshots/gui_5_admin_dashboard.png", "GUI Interface 5: Admin Control Center, Inventory Management & Quality Inspection Dashboard", width=Inches(6.3))

    # Save finalized document
    output_path = "task2.docx"
    doc.save(output_path)
    print(f"====================================================")
    print(f"✓ Task 2 Deliverable Document successfully built!")
    print(f"📁 Output file: {output_path}")
    print(f"📊 Size: {os.path.getsize(output_path)} bytes")
    print(f"====================================================")

if __name__ == '__main__':
    create_document()
