"""
management command: seed_demo
Location: backend/shops/management/commands/seed_demo.py

Prerequisites:
  - Add Expense to shops/models/__init__.py:
      from .operations import Inventory, PartUsage, Service, WorkOrder, Expense

Usage:
    python manage.py seed_demo                  # seed both users (skips if already seeded)
    python manage.py seed_demo --user oogway    # seed only one user
    python manage.py seed_demo --force          # wipe and re-seed regardless
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

User = get_user_model()

# ── shops app models ─────────────────────────────────────────────────────────
from shops.models import (
    Customer,
    CustomerPhone,
    Expense,
    Inventory,
    Invoice,
    Item,
    PartUsage,
    Technician,
    WorkOrder,
)

# ── UserProfile lives in the authentication app ───────────────────────────────
from authentication.models import UserProfile


# ─────────────────────────────────────────────────────────────────────────────
# Seed data — one block per username
# ─────────────────────────────────────────────────────────────────────────────

SHOPS = {
    "oogway": {
        "technicians": [
            # 2 OSTAs
            {"full_name": "Omar Sharaf",   "role": "OSTA", "hourly_rate": Decimal("120.00")},
            {"full_name": "Tariq Mansour", "role": "OSTA", "hourly_rate": Decimal("110.00")},
            # 2 SABIs
            {"full_name": "Karim Sabri",   "role": "SABI", "hourly_rate": Decimal("60.00")},
            {"full_name": "Youssef Nabil", "role": "SABI", "hourly_rate": Decimal("55.00")},
        ],
        "customers": [
            {"full_name": "Ahmed El-Sayed",  "phone": "+201012345678"},
            {"full_name": "Mona Fawzi",      "phone": "+201198765432"},
            {"full_name": "Hassan Mahmoud",  "phone": "+201234567890"},
            {"full_name": "Sara Khalil",     "phone": "+201556781234"},
            {"full_name": "Khaled Ibrahim",  "phone": "+201067893456"},
        ],
        # (customer_idx, device_type, brand, model_name, serial, subtype, extra)
        # ElectronicItem fields: password_hint, os_version
        # MechanicalItem fields: fuel_type, engine_displacement
        "devices": [
            (0, "ELEC", "Apple",   "iPhone 14 Pro",      "SN-OGW-001", "electronic", {"os_version": "iOS 17.4"}),
            (1, "ELEC", "Apple",   "MacBook Pro 16",     "SN-OGW-002", "electronic", {"os_version": "macOS Sonoma"}),
            (2, "ELEC", "Samsung", "Galaxy S24 Ultra",   "SN-OGW-003", "electronic", {"os_version": "Android 14"}),
            (3, "ELEC", "Lenovo",  "ThinkPad X1 Carbon", "SN-OGW-004", "electronic", {"os_version": "Windows 11"}),
            (4, "MECH", "Toyota",  "Corolla 2020",        "SN-OGW-005", "mechanical", {"fuel_type": "Petrol", "engine_displacement": "1.6L"}),
        ],
        "inventory": [
            # 4 PARTS
            {"name": "OLED Display Module",   "sku": "OGW-DSP-001", "product_type": "PART",   "cost_price": Decimal("200.00"), "retail_price": Decimal("280.00"), "stock_count": 3,  "low_stock_threshold": 5},
            {"name": "MacBook Keyboard Assy", "sku": "OGW-KBD-001", "product_type": "PART",   "cost_price": Decimal("300.00"), "retail_price": Decimal("420.00"), "stock_count": 2,  "low_stock_threshold": 3},
            {"name": "Li-Ion Battery Pack",   "sku": "OGW-BAT-001", "product_type": "PART",   "cost_price": Decimal("120.00"), "retail_price": Decimal("180.00"), "stock_count": 8,  "low_stock_threshold": 5},
            {"name": "USB-C Charging Port",   "sku": "OGW-PRT-001", "product_type": "PART",   "cost_price": Decimal("45.00"),  "retail_price": Decimal("75.00"),  "stock_count": 15, "low_stock_threshold": 10},
            # 4 RETAIL
            {"name": "Tempered Glass Screen", "sku": "OGW-ACC-001", "product_type": "RETAIL", "cost_price": Decimal("15.00"),  "retail_price": Decimal("35.00"),  "stock_count": 24, "low_stock_threshold": 10},
            {"name": "Silicone Phone Case",   "sku": "OGW-ACC-002", "product_type": "RETAIL", "cost_price": Decimal("20.00"),  "retail_price": Decimal("50.00"),  "stock_count": 30, "low_stock_threshold": 10},
            {"name": "Car Phone Holder",      "sku": "OGW-ACC-003", "product_type": "RETAIL", "cost_price": Decimal("25.00"),  "retail_price": Decimal("60.00"),  "stock_count": 18, "low_stock_threshold": 5},
            {"name": "Wireless Charger Pad",  "sku": "OGW-ACC-004", "product_type": "RETAIL", "cost_price": Decimal("80.00"),  "retail_price": Decimal("150.00"), "stock_count": 10, "low_stock_threshold": 5},
        ],
        "expenses": [
            {"title": "Shop Rent – March",      "amount": Decimal("4500.00"), "category": "rent"},
            {"title": "Electricity Bill",       "amount": Decimal("850.00"),  "category": "utilities"},
            {"title": "Parts Restock – March",  "amount": Decimal("6200.00"), "category": "parts"},
            {"title": "Staff Wages – March",    "amount": Decimal("8000.00"), "category": "labor"},
            {"title": "Marketing – Google Ads", "amount": Decimal("500.00"),  "category": "marketing"},
        ],
        # (device_idx, status, estimate, description, make_invoice, is_paid)
        # Note: assigned_osta_tech / assigned_sabi_tech left null —
        # those FKs point to authentication.UserProfile, not Technician.
        # Seeded Technician rows are standalone staff records without linked user accounts.
        "work_orders": [
            (0, "pending",    Decimal("350.00"),  "Screen flickering after water damage. Customer reports dropping phone in pool.",   False, False),
            (1, "diagnosing", Decimal("800.00"),  "Keyboard keys unresponsive. Battery health at 67%. Full assessment needed.",      False, False),
            (2, "parts",      Decimal("420.00"),  "Charging port replacement. Parts ordered and awaiting delivery.",                  False, False),
            (3, "working",    Decimal("600.00"),  "Motherboard repair in progress. Thermal paste reapplication included.",            False, False),
            (1, "ready",      Decimal("950.00"),  "Keyboard replaced. Battery swapped. Device tested and ready for pickup.",          True,  False),
            (0, "completed",  Decimal("380.00"),  "Water damage cleaned. OLED module replaced. Device functioning normally.",        True,  True),
            (4, "completed",  Decimal("1200.00"), "Engine diagnostics. Air filter and oil change. AC belt replaced.",                True,  True),
        ],
    },

    "oogwayoncoke": {
        "technicians": [
            {"full_name": "Mahmoud Gamal", "role": "OSTA", "hourly_rate": Decimal("130.00")},
            {"full_name": "Fady Aziz",     "role": "OSTA", "hourly_rate": Decimal("115.00")},
            {"full_name": "Amr Hassan",    "role": "SABI", "hourly_rate": Decimal("65.00")},
            {"full_name": "Ziad Farouk",   "role": "SABI", "hourly_rate": Decimal("60.00")},
        ],
        "customers": [
            {"full_name": "Nour El-Din",    "phone": "+201011112222"},
            {"full_name": "Rana Mostafa",   "phone": "+201099998888"},
            {"full_name": "Sameh Abdallah", "phone": "+201223334444"},
            {"full_name": "Dina Youssef",   "phone": "+201555556666"},
            {"full_name": "Wael Fouad",     "phone": "+201677778888"},
        ],
        "devices": [
            (0, "ELEC", "Apple", "iPad Pro 12.9",  "SN-OGC-001", "electronic", {"os_version": "iPadOS 17"}),
            (1, "ELEC", "HP",    "Spectre x360",   "SN-OGC-002", "electronic", {"os_version": "Windows 11"}),
            (2, "ELEC", "Apple", "iPhone 13",      "SN-OGC-003", "electronic", {"os_version": "iOS 16.7"}),
            (3, "ELEC", "Dell",  "XPS 15 9530",    "SN-OGC-004", "electronic", {"os_version": "Windows 11"}),
            (4, "MECH", "Honda", "Civic 2019",      "SN-OGC-005", "mechanical", {"fuel_type": "Petrol", "engine_displacement": "1.5L"}),
        ],
        "inventory": [
            # 4 PARTS
            {"name": "iPad LCD Assembly",   "sku": "OGC-DSP-001", "product_type": "PART",   "cost_price": Decimal("350.00"), "retail_price": Decimal("500.00"), "stock_count": 4,  "low_stock_threshold": 3},
            {"name": "HP Laptop Fan",       "sku": "OGC-FAN-001", "product_type": "PART",   "cost_price": Decimal("80.00"),  "retail_price": Decimal("130.00"), "stock_count": 6,  "low_stock_threshold": 4},
            {"name": "iPhone 13 Battery",   "sku": "OGC-BAT-001", "product_type": "PART",   "cost_price": Decimal("90.00"),  "retail_price": Decimal("140.00"), "stock_count": 10, "low_stock_threshold": 5},
            {"name": "DC Power Jack",       "sku": "OGC-JCK-001", "product_type": "PART",   "cost_price": Decimal("35.00"),  "retail_price": Decimal("60.00"),  "stock_count": 20, "low_stock_threshold": 8},
            # 4 RETAIL
            {"name": "iPad Tempered Glass", "sku": "OGC-ACC-001", "product_type": "RETAIL", "cost_price": Decimal("30.00"),  "retail_price": Decimal("70.00"),  "stock_count": 15, "low_stock_threshold": 5},
            {"name": "Laptop Cooling Pad",  "sku": "OGC-ACC-002", "product_type": "RETAIL", "cost_price": Decimal("120.00"), "retail_price": Decimal("220.00"), "stock_count": 8,  "low_stock_threshold": 3},
            {"name": "USB-C Hub 7-in-1",    "sku": "OGC-ACC-003", "product_type": "RETAIL", "cost_price": Decimal("150.00"), "retail_price": Decimal("280.00"), "stock_count": 12, "low_stock_threshold": 4},
            {"name": "Apple Watch Band",    "sku": "OGC-ACC-004", "product_type": "RETAIL", "cost_price": Decimal("40.00"),  "retail_price": Decimal("90.00"),  "stock_count": 22, "low_stock_threshold": 8},
        ],
        "expenses": [
            {"title": "Shop Rent – March",    "amount": Decimal("5000.00"), "category": "rent"},
            {"title": "Internet & Utilities", "amount": Decimal("700.00"),  "category": "utilities"},
            {"title": "Spare Parts Restock",  "amount": Decimal("7500.00"), "category": "parts"},
            {"title": "Technician Wages",     "amount": Decimal("9500.00"), "category": "labor"},
            {"title": "Instagram Ads",        "amount": Decimal("800.00"),  "category": "marketing"},
        ],
        "work_orders": [
            (0, "pending",    Decimal("500.00"),  "iPad screen cracked. Customer says digitizer still works but glass shattered.",    False, False),
            (1, "diagnosing", Decimal("350.00"),  "Laptop overheating and throttling. Fan noise reported. Full thermal check.",       False, False),
            (2, "parts",      Decimal("180.00"),  "Battery degraded to 71%. Original Apple battery on order.",                        False, False),
            (3, "working",    Decimal("750.00"),  "DC power jack broken. Board-level repair in progress.",                            False, False),
            (4, "ready",      Decimal("900.00"),  "Oil change, brake pad replacement, full inspection done. Ready for pickup.",        True,  False),
            (0, "completed",  Decimal("600.00"),  "iPad LCD assembly replaced. Touch ID verified. Customer collected.",               True,  True),
            (1, "completed",  Decimal("320.00"),  "Fan replaced. Thermal paste reapplied. Temps normal under load.",                  True,  True),
        ],
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _make_invoice(work_order, tenant, is_paid):
    subtotal = work_order.estimate_price or Decimal("0.00")
    tax      = (subtotal * Decimal("0.14")).quantize(Decimal("0.01"))
    total    = subtotal + tax
    Invoice.objects.create(
        tenant=tenant,
        work_order=work_order,
        subtotal=subtotal,
        tax=tax,
        total_amount=total,
        calculated_total=total,
        is_paid=is_paid,
    )


def _wipe_tenant(tenant, stdout, username):
    stdout.write(f"[{username}] Wiping existing data…")
    Invoice.objects.filter(tenant=tenant).delete()
    PartUsage.objects.filter(tenant=tenant).delete()
    WorkOrder.objects.filter(tenant=tenant).delete()
    Inventory.objects.filter(tenant=tenant).delete()
    Expense.objects.filter(tenant=tenant).delete()
    Item.objects.filter(tenant=tenant).delete()   # cascades to Electronic/Mechanical subtypes
    CustomerPhone.objects.filter(tenant=tenant).delete()
    Customer.objects.filter(tenant=tenant).delete()
    Technician.objects.filter(tenant=tenant).delete()


# ─────────────────────────────────────────────────────────────────────────────
# Core seeder
# ─────────────────────────────────────────────────────────────────────────────

def seed_for_user(username, stdout, force=False):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        raise CommandError(f"User '{username}' not found in the database.")

    try:
        profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        raise CommandError(
            f"UserProfile for '{username}' not found. Has this user completed onboarding?"
        )

    tenant = profile.tenant
    if tenant is None:
        raise CommandError(f"'{username}' has no tenant linked. Check UserProfile.tenant.")

    data = SHOPS.get(username)
    if data is None:
        raise CommandError(f"No seed data block defined for username '{username}'.")

    stdout.write(f"\n[{username}] Tenant: {tenant.shop_name} ({tenant.tenant_id})")

    # ── Idempotency guard ────────────────────────────────────────────────────
    if Technician.objects.filter(tenant=tenant).exists():
        if not force:
            stdout.write(
                f"[{username}] ⏭  Already seeded — skipping. "
                f"Run with --force to wipe and re-seed."
            )
            return
        _wipe_tenant(tenant, stdout, username)

    # ── Technicians ──────────────────────────────────────────────────────────
    stdout.write(f"[{username}] Creating technicians…")
    tech_objs = []
    ostas     = []
    for t in data["technicians"]:
        tech = Technician.objects.create(
            tenant=tenant,
            full_name=t["full_name"],
            role=t["role"],
            hourly_rate=t["hourly_rate"],
        )
        tech_objs.append(tech)
        if t["role"] == "OSTA":
            ostas.append(tech)

    # Wire SABIs to first OSTA as mentor
    for i, t in enumerate(data["technicians"]):
        if t["role"] == "SABI" and ostas:
            tech_objs[i].mentor = ostas[0]
            tech_objs[i].save()

    # ── Customers + Phones ───────────────────────────────────────────────────
    stdout.write(f"[{username}] Creating customers…")
    customer_objs = []
    for c in data["customers"]:
        cust = Customer.objects.create(tenant=tenant, full_name=c["full_name"])
        CustomerPhone.objects.create(tenant=tenant, customer=cust, phone_number=c["phone"])
        customer_objs.append(cust)

    # ── Devices ─────────────────────────────────────────────────────────────
    stdout.write(f"[{username}] Creating devices…")
    device_objs = []
    for (cust_idx, device_type, brand, model_name, serial, subtype, extra) in data["devices"]:
        item = Item.objects.create(
            tenant=tenant,
            customer=customer_objs[cust_idx],
            device_type=device_type,
            brand=brand,
            model_name=model_name,
            serial_number=serial,
        )
        device_objs.append(item)

    # ── Inventory ────────────────────────────────────────────────────────────
    stdout.write(f"[{username}] Creating inventory…")
    for inv in data["inventory"]:
        Inventory.objects.create(tenant=tenant, **inv)

    # ── Expenses ─────────────────────────────────────────────────────────────
    stdout.write(f"[{username}] Creating expenses…")
    for exp in data["expenses"]:
        Expense.objects.create(tenant=tenant, **exp)

    # ── Work Orders + Invoices ───────────────────────────────────────────────
    stdout.write(f"[{username}] Creating work orders…")
    from shops.models.operations import generate_ticket_id
    for (dev_idx, status, estimate, desc, make_inv, is_paid) in data["work_orders"]:
        wo = WorkOrder(
            tenant=tenant,
            item=device_objs[dev_idx],
            status=status,
            estimate_price=estimate,
            description=desc,
            assigned_osta_tech=None,
            assigned_sabi_tech=None,
            ticket_id=generate_ticket_id(),
        )
        # bypass the auto-transition in save() by setting status after assignment check
        wo.status = status
        wo.save()
        if make_inv:
            _make_invoice(wo, tenant, is_paid)

    part_count   = sum(1 for i in data["inventory"] if i["product_type"] == "PART")
    retail_count = sum(1 for i in data["inventory"] if i["product_type"] == "RETAIL")
    inv_count    = sum(1 for w in data["work_orders"] if w[4])
    wo_statuses  = [w[1] for w in data["work_orders"]]

    stdout.write(
        f"[{username}] ✓ Done — "
        f"{len(data['technicians'])} techs, "
        f"{len(customer_objs)} customers, "
        f"{len(device_objs)} devices, "
        f"{part_count} parts + {retail_count} retail, "
        f"{len(data['work_orders'])} orders ({', '.join(wo_statuses)}), "
        f"{inv_count} invoices"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Management command entry point
# ─────────────────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed demo data for oogway and oogwayoncoke (idempotent by default)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            type=str,
            default=None,
            help="Seed only this username (default: both oogway and oogwayoncoke)",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            default=False,
            help="Wipe existing data and re-seed even if already seeded",
        )

    def handle(self, *args, **options):
        target    = options["user"]
        force     = options["force"]
        usernames = [target] if target else ["oogway", "oogwayoncoke"]

        if force:
            self.stdout.write(self.style.WARNING(f"--force: wiping and re-seeding {usernames}"))
        else:
            self.stdout.write(self.style.WARNING(f"Seeding {usernames} (skips if already done)"))

        with transaction.atomic():
            for username in usernames:
                seed_for_user(username, self.stdout, force=force)

        self.stdout.write(self.style.SUCCESS("\nAll done."))