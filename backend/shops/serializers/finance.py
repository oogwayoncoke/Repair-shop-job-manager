from django.db.models import ExpressionWrapper, F, Sum, fields
from rest_framework import serializers

from ..models import Invoice
from ..models.operations import Expense, WorkOrder


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )

    class Meta:
        model = Expense
        fields = [
            "id",
            "shop",
            "title",
            "amount",
            "category",
            "category_display",
            "recorded_at",
        ]


class FinanceSummarySerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    expense_breakdown = serializers.DictField()

    def get_summary(self, tenant):
        revenue = (
            WorkOrder.objects.filter(tenant=tenant, status="completed").aggregate(
                total=Sum("estimate_price")
            )["total"]
            or 0
        )

        expenses = (
            Expense.objects.filter(tenant=tenant).aggregate(total=Sum("amount"))[
                "total"
            ]
            or 0
        )

        categories = (
            Expense.objects.filter(tenant=tenant)
            .values("category")
            .annotate(total=Sum("amount"))
        )

        breakdown = {item["category"]: float(item["total"]) for item in categories}

        return {
            "total_revenue": float(revenue),
            "total_expenses": float(expenses),
            "net_profit": float(revenue - expenses),
            "expense_breakdown": breakdown,
        }


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )

    class Meta:
        model = Expense
        fields = [
            "id",
            "shop",
            "title",
            "amount",
            "category",
            "category_display",
            "recorded_at",
        ]


class FinanceSummarySerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    expense_breakdown = serializers.DictField()

    def get_summary(self, tenant):
        revenue = (
            WorkOrder.objects.filter(tenant=tenant, status="completed").aggregate(
                total=Sum("estimate_price")
            )["total"]
            or 0
        )

        expenses = (
            Expense.objects.filter(tenant=tenant).aggregate(total=Sum("amount"))[
                "total"
            ]
            or 0
        )

        categories = (
            Expense.objects.filter(tenant=tenant)
            .values("category")
            .annotate(total=Sum("amount"))
        )

        breakdown = {item["category"]: float(item["total"]) for item in categories}

        return {
            "total_revenue": float(revenue),
            "total_expenses": float(expenses),
            "net_profit": float(revenue - expenses),
            "expense_breakdown": breakdown,
        }


class InvoiceSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="work_order.item.name", read_only=True)
    work_order_ticket_id = serializers.CharField(
        source="work_order.ticket_id", read_only=True
    )
    labor_cost = serializers.SerializerMethodField()
    parts_breakdown = serializers.SerializerMethodField()
    services_breakdown = serializers.SerializerMethodField()
    # Adding tax and total breakdown
    tax_amount = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "work_order",
            "work_order_ticket_id",
            "item_name",
            "total_amount",
            "tax_amount",
            "labor_cost",
            "parts_breakdown",
            "services_breakdown",
            "is_paid",
        ]

    def _calculate_subtotal(self, obj):
        # 1. Calculate Labor
        order = obj.work_order
        base = float(order.estimate_price or 0.0)
        sessions = order.sessions.filter(end_time__isnull=False)
        total_seconds = sum(
            (s.end_time - s.start_time).total_seconds() for s in sessions
        )
        tech = order.assigned_osta_tech or order.assigned_sabi_tech
        rate = float(getattr(tech, "hourly_rate", 100.0)) if tech else 100.0
        labor = base + ((total_seconds / 3600) * rate)

        # 2. Calculate Parts
        parts = sum(
            float(p.price_at_use or 0.0) * p.quantity_used
            for p in order.requisitions.all()
        )

        # 3. Calculate Fixed Services
        services = sum(float(s.cost) for s in order.services.all())

        return labor + parts + services

    def get_labor_cost(self, obj):
        # Re-using logic to return just the labor component
        order = obj.work_order
        base = float(order.estimate_price or 0.0)
        sessions = order.sessions.filter(end_time__isnull=False)
        total_seconds = sum(
            (s.end_time - s.start_time).total_seconds() for s in sessions
        )
        tech = order.assigned_osta_tech or order.assigned_sabi_tech
        rate = float(getattr(tech, "hourly_rate", 100.0)) if tech else 100.0
        return round(base + ((total_seconds / 3600) * rate), 2)

    def get_tax_amount(self, obj):
        # Calculating 14% Tax on the subtotal
        subtotal = self._calculate_subtotal(obj)
        return round(subtotal * 0.14, 2)

    def get_services_breakdown(self, obj):
        return [
            {"name": s.service_name, "cost": float(s.cost)}
            for s in obj.work_order.services.all()
        ]

    def get_parts_breakdown(self, obj):
        return [
            {
                "name": p.inventory_item.name,
                "quantity": p.quantity_used,
                "price": float(p.price_at_use or 0.0),
            }
            for p in obj.work_order.requisitions.all()
        ]

    def get_total_amount(self, obj):
        # Subtotal + Tax = Final Total
        subtotal = self._calculate_subtotal(obj)
        tax = subtotal * 0.14
        return round(subtotal + tax, 2)
