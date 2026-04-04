from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Invoice
from ..models.operations import Expense
from ..serializers.finance import ExpenseSerializer, FinanceSummarySerializer, InvoiceSerializer


class FinanceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        if not profile or profile.role != "OWNER":
            return Response(
                {"detail": "Access restricted to shop owners."},
                status=status.HTTP_403_FORBIDDEN,
            )
        tenant = profile.tenant
        serializer = FinanceSummarySerializer()
        data = serializer.get_summary(tenant)
        return Response(data, status=status.HTTP_200_OK)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        if not profile:
            return Expense.objects.none()
        return Expense.objects.filter(tenant=profile.tenant).order_by("-recorded_at")

    def perform_create(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        if not profile or profile.role != "OWNER":
            raise PermissionDenied("Only shop owners can record expenses.")
        serializer.save(tenant=profile.tenant)

    def perform_update(self, serializer):
        profile = getattr(self.request.user, "profile", None)
        if not profile or profile.role != "OWNER":
            raise PermissionDenied("Only shop owners can edit expenses.")
        serializer.save()

    def perform_destroy(self, instance):
        profile = getattr(self.request.user, "profile", None)
        if not profile or profile.role != "OWNER":
            raise PermissionDenied("Only shop owners can delete expenses.")
        instance.delete()


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        if not profile:
            return Invoice.objects.none()
        return Invoice.objects.filter(tenant=profile.tenant)

    @action(detail=True, methods=["patch"], url_path="mark-paid")
    def mark_as_paid(self, request, pk=None):
        invoice = self.get_object()
        user_profile = getattr(self.request.user, "profile", None)
        if not user_profile or user_profile.role != "OWNER":
            raise PermissionDenied({"detail": "Only the shop owner can confirm settlement."})
        invoice.is_paid = True
        invoice.save()
        return Response({"status": "settled", "invoice_id": invoice.id}, status=status.HTTP_200_OK)