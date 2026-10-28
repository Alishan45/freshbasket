import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Ellipse, Rectangle
import numpy as np

# Set overall aesthetic style
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# ==============================================================================
# 1. USE CASE DIAGRAM
# ==============================================================================
def generate_use_case_diagram():
    fig, ax = plt.subplots(figsize=(15, 11), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 11)
    ax.axis('off')

    # Background canvas
    fig.patch.set_facecolor('#FAFAF9')
    ax.set_facecolor('#FAFAF9')

    # Title Banner
    ax.text(7.5, 10.5, "FreshBasket - System Use Case Diagram", 
            ha='center', va='center', fontsize=18, fontweight='bold', color='#14532D')
    ax.text(7.5, 10.15, "Actors: Customer, Administrator, Delivery Staff | Core Functional Interactions", 
            ha='center', va='center', fontsize=11, color='#57534E')

    # System Boundary Box
    system_box = FancyBboxPatch((2.7, 0.4), 9.6, 9.4,
                                boxstyle="round,pad=0.2,rounding_size=0.3",
                                facecolor="#FFFFFF", edgecolor="#16A34A", linewidth=2.5, linestyle='-')
    ax.add_patch(system_box)
    ax.text(7.5, 9.55, "System Boundary: FreshBasket Platform", 
            ha='center', va='center', fontsize=13, fontweight='bold', color='#15803D',
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#DCFCE7", edgecolor="#86EFAC", lw=1))

    # Helper function for stick figures
    def draw_actor(x, y, label, role_color="#1E293B"):
        # Head
        head = plt.Circle((x, y + 0.5), 0.22, color=role_color, ec='#0F172A', lw=1.5, zorder=5)
        ax.add_patch(head)
        # Body
        ax.plot([x, x], [y + 0.28, y - 0.25], color='#0F172A', lw=2.5, zorder=5)
        # Arms
        ax.plot([x - 0.35, x + 0.35], [y + 0.1, y + 0.1], color='#0F172A', lw=2.5, zorder=5)
        # Legs
        ax.plot([x, x - 0.25], [y - 0.25, y - 0.7], color='#0F172A', lw=2.5, zorder=5)
        ax.plot([x, x + 0.25], [y - 0.25, y - 0.7], color='#0F172A', lw=2.5, zorder=5)
        # Label Box
        ax.text(x, y - 0.95, label, ha='center', va='center', fontsize=11, fontweight='bold', color=role_color,
                bbox=dict(boxstyle="round,pad=0.25", facecolor="#F1F5F9", edgecolor="#CBD5E1", lw=1))

    # Draw Actors
    draw_actor(1.3, 5.5, "Customer\n(End User)", "#047857")
    draw_actor(13.7, 6.8, "Administrator\n(Store Manager)", "#B45309")
    draw_actor(13.7, 2.5, "Delivery Staff\n(Courier Rider)", "#1D4ED8")

    # Use Cases Definitions (x, y, text, color, category)
    use_cases = [
        # Customer core
        (4.4, 8.8, "Register & Manage\nUser Profile", "#F0FDF4", "#16A34A"),
        (4.4, 7.6, "Browse Catalog &\nFilter Fresh Produce", "#F0FDF4", "#16A34A"),
        (4.4, 6.4, "View Nutritional Info\n& Farm Provenance", "#F0FDF4", "#16A34A"),
        (4.4, 5.2, "Add to Cart &\nSelect Measurement Units", "#F0FDF4", "#16A34A"),
        (4.4, 4.0, "Checkout with Address &\nDelivery Time Slot", "#F0FDF4", "#16A34A"),
        (4.4, 2.8, "Pay via Cash on\nDelivery (COD)", "#F0FDF4", "#16A34A"),
        (4.4, 1.6, "Track 4-Stage Live\nOrder Status", "#F0FDF4", "#16A34A"),
        (7.5, 8.6, "Submit Star Rating &\nPhoto Review", "#FEF3C7", "#D97706"),
        (7.5, 6.8, "Verify Produce Freshness\nUpon Door Arrival", "#FEF3C7", "#D97706"),

        # Admin core
        (10.6, 8.8, "Manage Products &\nInventory Stock", "#FFFBEB", "#D97706"),
        (10.6, 7.5, "Conduct Quality Inspection\n& Grade Freshness", "#FFFBEB", "#D97706"),
        (10.6, 6.2, "Update Order Stages\n(Confirm/Pack/Out/Done)", "#FFFBEB", "#D97706"),
        (10.6, 4.9, "Moderate Reviews &\nPost Farm Responses", "#FFFBEB", "#D97706"),
        (7.5, 4.2, "View Sales Analytics &\nLow-Stock Alerts", "#FFFBEB", "#D97706"),

        # Delivery Staff
        (10.6, 2.8, "View Dispatch Route &\nCustomer Instructions", "#EFF6FF", "#2563EB"),
        (10.6, 1.5, "Collect COD Payment &\nConfirm Delivery", "#EFF6FF", "#2563EB"),
    ]

    # Draw Ellipses
    for (ux, uy, utext, bg_color, border_color) in use_cases:
        ellipse = Ellipse((ux, uy), 2.3, 0.85, facecolor=bg_color, edgecolor=border_color, lw=1.8, zorder=3)
        ax.add_patch(ellipse)
        ax.text(ux, uy, utext, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#1C1917', zorder=4)

    # Actor-to-Use-Case Association Lines
    # Customer lines (from (1.5, 5.5))
    cust_targets = [(4.4, 8.8), (4.4, 7.6), (4.4, 6.4), (4.4, 5.2), (4.4, 4.0), (4.4, 2.8), (4.4, 1.6), (7.5, 8.6), (7.5, 6.8)]
    for tx, ty in cust_targets:
        ax.plot([1.5, tx - 1.15], [5.5, ty], color='#047857', lw=1.2, alpha=0.75, zorder=2)

    # Admin lines (from (13.5, 6.8))
    admin_targets = [(10.6, 8.8), (10.6, 7.5), (10.6, 6.2), (10.6, 4.9), (7.5, 4.2), (10.6, 2.8)]
    for tx, ty in admin_targets:
        ax.plot([13.5, tx + 1.15], [6.8, ty], color='#B45309', lw=1.2, alpha=0.75, zorder=2)

    # Delivery Staff lines (from (13.5, 2.5))
    delivery_targets = [(10.6, 2.8), (10.6, 1.5), (4.4, 2.8)]
    for tx, ty in delivery_targets:
        ax.plot([13.5, tx + 1.15 if tx > 10 else tx + 1.15], [2.5, ty], color='#1D4ED8', lw=1.2, alpha=0.75, zorder=2)

    # Include / Extend Relationships
    # Checkout includes COD
    ax.annotate("<<include>>", xy=(4.4, 3.25), xytext=(4.4, 3.6),
                ha='center', fontsize=7.5, fontweight='bold', color='#B91C1C')
    ax.plot([4.4, 4.4], [3.55, 3.25], color='#B91C1C', lw=1.2, linestyle='--', zorder=4)

    # Browse Catalog extends Nutritional Info
    ax.annotate("<<extend>>", xy=(4.4, 6.85), xytext=(4.4, 7.05),
                ha='center', fontsize=7.5, fontweight='bold', color='#4338CA')
    ax.plot([4.4, 4.4], [7.15, 6.85], color='#4338CA', lw=1.2, linestyle='--', zorder=4)

    # Quality inspection includes update stage
    ax.annotate("<<include>>", xy=(10.6, 6.65), xytext=(10.6, 6.9),
                ha='center', fontsize=7.5, fontweight='bold', color='#B91C1C')
    ax.plot([10.6, 10.6], [7.05, 6.65], color='#B91C1C', lw=1.2, linestyle='--', zorder=4)

    plt.tight_layout()
    plt.savefig('diagrams/use_case_diagram.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("✓ Use Case Diagram generated: diagrams/use_case_diagram.png")

# ==============================================================================
# 2. WORK PLAN (GANTT CHART)
# ==============================================================================
def generate_work_plan_gantt():
    fig, ax = plt.subplots(figsize=(15, 8.5), dpi=300)
    fig.patch.set_facecolor('#FAFAF9')
    ax.set_facecolor('#FFFFFF')

    tasks = [
        "Phase 1: Project Proposal & Requirement Specification (SRS)",
        "Phase 1.1: Literature Survey & Feasibility Analysis",
        "Phase 1.2: Functional & Non-Functional Requirements Definition",
        "Phase 2: System Modeling (Use Cases, ERD & Database Design)",
        "Phase 2.1: Use Case Specifications & Process Workflow Modeling",
        "Phase 2.2: Relational Database Schema & Integrity Constraints",
        "Phase 3: UI/UX Wireframing & Prototyping (Design System)",
        "Phase 3.1: Customer Marketplace & Produce Catalog Interface",
        "Phase 3.2: Cart, Multi-Unit Selector & Cash-on-Delivery Checkout",
        "Phase 4: Core Implementation & API Development",
        "Phase 4.1: Product Catalog & Dynamic Multi-Filter Engine",
        "Phase 4.2: 4-Stage Live Order Fulfillment & Tracking System",
        "Phase 4.3: Admin Control Panel & Quality Freshness Certification",
        "Phase 5: System Integration & Quality Assurance Testing",
        "Phase 5.1: Unit, Integration & Responsive Mobile Compatibility Testing",
        "Phase 5.2: User Acceptance Testing (UAT) & Performance Tuning",
        "Phase 6: Final Documentation, Deployment & Presentation",
        "Phase 6.1: Final Comprehensive Project Report Compilation",
        "Phase 6.2: Final Project Demonstration & Viva Presentation"
    ]

    # Task durations (start_week, duration_in_weeks) across 18 weeks
    schedules = [
        (1, 3, '#16A34A', True),   # Phase 1
        (1, 1.5, '#4ADE80', False),
        (2, 1.5, '#4ADE80', False),
        (3.5, 3, '#0284C7', True), # Phase 2
        (3.5, 1.5, '#38BDF8', False),
        (4.5, 2, '#38BDF8', False),
        (6, 3, '#D97706', True),   # Phase 3
        (6, 2, '#FBBF24', False),
        (7, 2, '#FBBF24', False),
        (8.5, 5.5, '#7C3AED', True),# Phase 4
        (8.5, 2.5, '#A78BFA', False),
        (10.5, 2.5, '#A78BFA', False),
        (12, 2, '#A78BFA', False),
        (13.5, 2.5, '#E11D48', True),# Phase 5
        (13.5, 1.5, '#FB7185', False),
        (14.5, 1.5, '#FB7185', False),
        (15.5, 2.5, '#059669', True),# Phase 6
        (15.5, 1.5, '#34D399', False),
        (17, 1, '#34D399', False)
    ]

    y_pos = np.arange(len(tasks))
    y_pos = y_pos[::-1] # reverse so top is first

    for i, (start, dur, color, is_major) in enumerate(schedules):
        h = 0.55 if is_major else 0.35
        y = y_pos[i] - h/2
        rect = FancyBboxPatch((start, y), dur, h,
                              boxstyle="round,pad=0.04,rounding_size=0.15",
                              facecolor=color, edgecolor='#334155' if is_major else 'none',
                              lw=1.2 if is_major else 0, alpha=0.9, zorder=3)
        ax.add_patch(rect)
        # Add week duration label inside or next to bar
        ax.text(start + dur / 2, y_pos[i], f"{dur}w", ha='center', va='center',
                fontsize=7.5, fontweight='bold', color='#FFFFFF' if is_major else '#1E293B', zorder=4)

    # Formatting axes
    ax.set_yticks(y_pos)
    ax.set_yticklabels(tasks, fontsize=8.5, fontweight='medium')
    for tick, (start, dur, color, is_major) in zip(ax.get_yticklabels(), schedules):
        if is_major:
            tick.set_fontweight('bold')
            tick.set_color('#0F172A')
        else:
            tick.set_color('#475569')

    ax.set_xlim(0.5, 18.5)
    ax.set_xticks(np.arange(1, 19))
    ax.set_xticklabels([f"W{i}" for i in range(1, 19)], fontsize=9, fontweight='bold')
    ax.set_xlabel("Project Timeline Schedule (Weeks 1 - 18)", fontsize=11, fontweight='bold', labelpad=10)

    # Grid lines
    ax.grid(True, axis='x', color='#E2E8F0', linestyle='--', linewidth=0.8, zorder=0)

    # Milestone Vertical Markers
    milestones = [
        (3, "M1: SRS & Deliverable 1", '#15803D'),
        (6.5, "M2: System Design & ERD", '#0369A1'),
        (14, "M3: Prototype Complete", '#6D28D9'),
        (16, "M4: Testing & QA Signed", '#BE123C'),
        (18, "M5: Final Submission & Viva", '#047857')
    ]
    for w, mlabel, mcolor in milestones:
        ax.axvline(w, color=mcolor, linestyle=':', lw=1.5, zorder=1)
        ax.text(w, len(tasks) - 0.2, f"♦ {mlabel}", rotation=45, ha='left', va='bottom',
                fontsize=7.5, fontweight='bold', color=mcolor, zorder=5)

    ax.set_title("FreshBasket - Work Plan & Gantt Chart (Final Project Lifecycle)", 
                 fontsize=15, fontweight='bold', color='#14532D', pad=35)

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

    ax.text(8.0, 11.5, "FreshBasket - Entity Relationship Diagram (ERD)", 
            ha='center', va='center', fontsize=18, fontweight='bold', color='#14532D')
    ax.text(8.0, 11.15, "Relational Schema Model with Crow's Foot Cardinalities, Keys & Relationships", 
            ha='center', va='center', fontsize=11, color='#57534E')

    # Entity box drawer
    def draw_entity(x, y, w, h, title, attributes, title_color="#16A34A"):
        # Header Box
        header = FancyBboxPatch((x, y + h - 0.6), w, 0.6,
                                boxstyle="round,pad=0.02,rounding_size=0.15",
                                facecolor=title_color, edgecolor='#334155', lw=1.2, zorder=4)
        ax.add_patch(header)
        ax.text(x + w/2, y + h - 0.3, title, ha='center', va='center',
                fontsize=10.5, fontweight='bold', color='#FFFFFF', zorder=5)

        # Body Box
        body = FancyBboxPatch((x, y), w, h - 0.6,
                              boxstyle="round,pad=0.02,rounding_size=0.15",
                              facecolor="#FFFFFF", edgecolor='#94A3B8', lw=1.2, zorder=3)
        ax.add_patch(body)

        # Attributes text
        line_spacing = (h - 0.7) / (len(attributes) + 0.2)
        curr_y = y + h - 0.9
        for attr in attributes:
            is_pk = "PK" in attr
            is_fk = "FK" in attr
            col = "#B91C1C" if is_pk else ("#2563EB" if is_fk else "#334155")
            weight = 'bold' if (is_pk or is_fk) else 'normal'
            ax.text(x + 0.15, curr_y, attr, ha='left', va='center',
                    fontsize=7.8, fontweight=weight, color=col, fontfamily='monospace', zorder=5)
            curr_y -= line_spacing

    # 8 Entities
    # 1. USERS
    draw_entity(0.8, 7.8, 3.2, 3.0, "USERS", [
        "PK  user_id : INT",
        "    full_name : VARCHAR(100)",
        "    email : VARCHAR(120) [UQ]",
        "    password_hash : VARCHAR(255)",
        "    phone_number : VARCHAR(20)",
        "    role : ENUM(cust, admin)",
        "    created_at : TIMESTAMP"
    ], "#0F766E")

    # 2. ADDRESSES
    draw_entity(0.8, 3.5, 3.2, 3.2, "ADDRESSES", [
        "PK  address_id : INT",
        "FK  user_id : INT",
        "    label : VARCHAR(50)",
        "    street_address : TEXT",
        "    area : VARCHAR(100)",
        "    city : VARCHAR(50)",
        "    phone : VARCHAR(20)",
        "    is_default : BOOLEAN"
    ], "#0284C7")

    # 3. CATEGORIES
    draw_entity(12.0, 7.8, 3.2, 2.4, "CATEGORIES", [
        "PK  category_id : INT",
        "    name : VARCHAR(60)",
        "    slug : VARCHAR(60) [UQ]",
        "    description : TEXT",
        "    is_active : BOOLEAN"
    ], "#D97706")

    # 4. PRODUCTS
    draw_entity(8.0, 6.8, 3.3, 3.8, "PRODUCTS", [
        "PK  product_id : INT",
        "FK  category_id : INT",
        "    name : VARCHAR(120)",
        "    unit_type : VARCHAR(30)",
        "    unit_price : DECIMAL(10,2)",
        "    stock_quantity : INT",
        "    freshness_grade : VARCHAR(30)",
        "    freshness_score : INT",
        "    is_organic : BOOLEAN",
        "    is_seasonal : BOOLEAN",
        "    farm_origin : VARCHAR(150)",
        "    image_url : VARCHAR(255)"
    ], "#15803D")

    # 5. ORDERS
    draw_entity(4.5, 6.8, 3.0, 3.8, "ORDERS", [
        "PK  order_id : INT",
        "FK  user_id : INT",
        "FK  address_id : INT",
        "    order_number : VARCHAR(30)",
        "    subtotal : DECIMAL(10,2)",
        "    delivery_fee : DECIMAL(10,2)",
        "    total_amount : DECIMAL(10,2)",
        "    payment_type : VARCHAR(20)",
        "    order_status : ENUM",
        "    delivery_slot : VARCHAR(60)",
        "    special_notes : TEXT",
        "    placed_at : TIMESTAMP"
    ], "#B45309")

    # 6. ORDER_ITEMS
    draw_entity(4.5, 2.2, 3.0, 2.8, "ORDER_ITEMS", [
        "PK  order_item_id : INT",
        "FK  order_id : INT",
        "FK  product_id : INT",
        "    unit_name : VARCHAR(30)",
        "    unit_price : DECIMAL(10,2)",
        "    quantity : INT",
        "    subtotal : DECIMAL(10,2)"
    ], "#7C3AED")

    # 7. QUALITY_CHECKS
    draw_entity(8.5, 1.8, 3.2, 3.2, "QUALITY_CHECKS", [
        "PK  check_id : INT",
        "FK  product_id : INT",
        "FK  inspector_id : INT",
        "    batch_code : VARCHAR(50)",
        "    grade_assigned : VARCHAR(20)",
        "    freshness_score : INT",
        "    harvest_timestamp : DATETIME",
        "    inspection_date : DATETIME",
        "    certification_note : TEXT"
    ], "#047857")

    # 8. REVIEWS
    draw_entity(12.2, 2.0, 3.2, 3.0, "REVIEWS", [
        "PK  review_id : INT",
        "FK  product_id : INT",
        "FK  user_id : INT",
        "    rating_stars : INT",
        "    freshness_stars : INT",
        "    review_comment : TEXT",
        "    photo_url : VARCHAR(255)",
        "    seller_response : TEXT",
        "    created_at : TIMESTAMP"
    ], "#DC2626")

    # Draw Relationship Lines with Crow's Foot styling
    def draw_rel(x1, y1, x2, y2, label="", color="#475569"):
        ax.plot([x1, x2], [y1, y2], color=color, lw=1.8, zorder=2)
        if label:
            mx, my = (x1 + x2)/2, (y1 + y2)/2
            ax.text(mx, my + 0.15, label, ha='center', va='center',
                    fontsize=7.5, fontweight='bold', color=color,
                    bbox=dict(boxstyle="round,pad=0.15", facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=0.8))

    # USERS (1) -> (M) ADDRESSES
    draw_rel(2.4, 7.8, 2.4, 6.7, "1 : N")
    # USERS (1) -> (M) ORDERS
    draw_rel(4.0, 8.8, 4.5, 8.8, "1 : N")
    # ADDRESSES (1) -> (M) ORDERS
    draw_rel(4.0, 5.0, 4.5, 7.2, "1 : N")
    # ORDERS (1) -> (M) ORDER_ITEMS
    draw_rel(6.0, 6.8, 6.0, 5.0, "1 : N")
    # CATEGORIES (1) -> (M) PRODUCTS
    draw_rel(12.0, 8.8, 11.3, 8.8, "1 : N")
    # PRODUCTS (1) -> (M) ORDER_ITEMS
    draw_rel(8.0, 7.5, 7.5, 4.0, "1 : N")
    # PRODUCTS (1) -> (M) QUALITY_CHECKS
    draw_rel(9.6, 6.8, 9.6, 5.0, "1 : N")
    # PRODUCTS (1) -> (M) REVIEWS
    draw_rel(11.3, 7.0, 12.2, 4.5, "1 : N")

    # Legend Box
    leg_box = FancyBboxPatch((0.8, 0.4), 14.6, 0.9,
                             boxstyle="round,pad=0.1,rounding_size=0.15",
                             facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=1)
    ax.add_patch(leg_box)
    ax.text(1.2, 0.85, "ERD Key / Legend:", fontsize=8.5, fontweight='bold', color='#1E293B')
    ax.text(3.5, 0.85, "PK : Primary Key (Red)", fontsize=8, fontweight='bold', color='#B91C1C')
    ax.text(6.8, 0.85, "FK : Foreign Key (Blue)", fontsize=8, fontweight='bold', color='#2563EB')
    ax.text(10.0, 0.85, "1 : N : One-to-Many Relationship", fontsize=8, fontweight='bold', color='#475569')
    ax.text(13.2, 0.85, "UQ : Unique Constraint", fontsize=8, fontweight='bold', color='#059669')

    plt.tight_layout()
    plt.savefig('diagrams/erd_diagram.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("✓ ERD Diagram generated: diagrams/erd_diagram.png")

# ==============================================================================
# 4. DATABASE RELATIONAL SCHEMA DIAGRAM
# ==============================================================================
def generate_db_schema_diagram():
    fig, ax = plt.subplots(figsize=(15, 9), dpi=300)
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 9)
    ax.axis('off')

    fig.patch.set_facecolor('#FAFAF9')
    ax.set_facecolor('#FAFAF9')

    ax.text(7.5, 8.6, "FreshBasket - Relational Database Schema Architecture", 
            ha='center', va='center', fontsize=17, fontweight='bold', color='#14532D')
    ax.text(7.5, 8.25, "Physical Relational Tables, Data Types, Primary & Foreign Key Integrity Mappings", 
            ha='center', va='center', fontsize=10.5, color='#57534E')

    # Draw schema table cards
    tables = [
        (0.6, 4.4, 3.2, 3.5, "tbl_users", [
            ("user_id", "INT AUTO_INC", "PK"),
            ("full_name", "VARCHAR(100)", "NN"),
            ("email", "VARCHAR(120)", "UQ, NN"),
            ("password_hash", "VARCHAR(255)", "NN"),
            ("phone_number", "VARCHAR(20)", "NN"),
            ("role", "ENUM('cust','adm')", "NN"),
            ("created_at", "DATETIME", "DEFAULT NOW()")
        ], "#047857"),

        (4.2, 4.4, 3.2, 3.5, "tbl_addresses", [
            ("address_id", "INT AUTO_INC", "PK"),
            ("user_id", "INT", "FK -> users"),
            ("label", "VARCHAR(50)", "NN"),
            ("street_address", "TEXT", "NN"),
            ("area", "VARCHAR(100)", ""),
            ("city", "VARCHAR(50)", "NN"),
            ("phone", "VARCHAR(20)", "NN"),
            ("is_default", "TINYINT(1)", "DEFAULT 0")
        ], "#0284C7"),

        (7.8, 4.4, 3.3, 3.5, "tbl_orders", [
            ("order_id", "INT AUTO_INC", "PK"),
            ("user_id", "INT", "FK -> users"),
            ("address_id", "INT", "FK -> addresses"),
            ("order_number", "VARCHAR(30)", "UQ, NN"),
            ("total_amount", "DECIMAL(10,2)", "NN"),
            ("payment_mode", "VARCHAR(20)", "DEFAULT 'COD'"),
            ("order_status", "ENUM(4 stages)", "NN"),
            ("delivery_slot", "VARCHAR(60)", "NN")
        ], "#B45309"),

        (11.4, 4.4, 3.0, 3.5, "tbl_order_items", [
            ("item_id", "INT AUTO_INC", "PK"),
            ("order_id", "INT", "FK -> orders"),
            ("product_id", "INT", "FK -> products"),
            ("unit_name", "VARCHAR(30)", "NN"),
            ("unit_price", "DECIMAL(10,2)", "NN"),
            ("quantity", "INT", "NN"),
            ("subtotal", "DECIMAL(10,2)", "NN")
        ], "#7C3AED"),

        (0.6, 0.6, 3.2, 3.4, "tbl_categories", [
            ("category_id", "INT AUTO_INC", "PK"),
            ("name", "VARCHAR(60)", "UQ, NN"),
            ("slug", "VARCHAR(60)", "UQ, NN"),
            ("description", "TEXT", ""),
            ("is_active", "TINYINT(1)", "DEFAULT 1")
        ], "#D97706"),

        (4.2, 0.6, 3.2, 3.4, "tbl_products", [
            ("product_id", "INT AUTO_INC", "PK"),
            ("category_id", "INT", "FK -> categories"),
            ("name", "VARCHAR(120)", "NN"),
            ("unit_price", "DECIMAL(10,2)", "NN"),
            ("stock_qty", "INT", "DEFAULT 0"),
            ("freshness_grade", "VARCHAR(30)", "NN"),
            ("freshness_score", "INT", "DEFAULT 95"),
            ("is_organic", "TINYINT(1)", "DEFAULT 0")
        ], "#15803D"),

        (7.8, 0.6, 3.3, 3.4, "tbl_quality_checks", [
            ("check_id", "INT AUTO_INC", "PK"),
            ("product_id", "INT", "FK -> products"),
            ("batch_code", "VARCHAR(50)", "NN"),
            ("freshness_score", "INT", "NN"),
            ("grade_assigned", "VARCHAR(20)", "NN"),
            ("harvest_time", "DATETIME", "NN"),
            ("inspection_time", "DATETIME", "DEFAULT NOW()")
        ], "#0E7490"),

        (11.4, 0.6, 3.0, 3.4, "tbl_reviews", [
            ("review_id", "INT AUTO_INC", "PK"),
            ("product_id", "INT", "FK -> products"),
            ("user_id", "INT", "FK -> users"),
            ("rating_stars", "TINYINT", "NN"),
            ("freshness_stars", "TINYINT", "NN"),
            ("comment_text", "TEXT", "NN"),
            ("seller_response", "TEXT", "")
        ], "#DC2626")
    ]

    for (x, y, w, h, tname, cols, col_color) in tables:
        # Header
        h_box = FancyBboxPatch((x, y + h - 0.5), w, 0.5,
                               boxstyle="round,pad=0.02,rounding_size=0.1",
                               facecolor=col_color, edgecolor='#334155', lw=1)
        ax.add_patch(h_box)
        ax.text(x + w/2, y + h - 0.25, tname, ha='center', va='center',
                fontsize=9.5, fontweight='bold', color='#FFFFFF')

        # Body
        b_box = FancyBboxPatch((x, y), w, h - 0.5,
                               boxstyle="round,pad=0.02,rounding_size=0.1",
                               facecolor="#FFFFFF", edgecolor='#CBD5E1', lw=1)
        ax.add_patch(b_box)

        curr_y = y + h - 0.75
        step = (h - 0.6) / (len(cols) + 0.3)
        for cname, ctype, ckey in cols:
            ax.text(x + 0.12, curr_y, cname, fontsize=7.5, fontweight='bold', color='#1E293B')
            ax.text(x + 1.6, curr_y, ctype, fontsize=7, color='#64748B', fontfamily='monospace')
            if ckey:
                ck_col = "#DC2626" if "PK" in ckey else ("#2563EB" if "FK" in ckey else "#059669")
                ax.text(x + w - 0.1, curr_y, ckey, ha='right', fontsize=6.8, fontweight='bold', color=ck_col)
            curr_y -= step

    plt.tight_layout()
    plt.savefig('diagrams/database_schema.png', dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print("✓ Database Relational Schema Diagram generated: diagrams/database_schema.png")

if __name__ == '__main__':
    generate_use_case_diagram()
    generate_work_plan_gantt()
    generate_erd_diagram()
    generate_db_schema_diagram()
