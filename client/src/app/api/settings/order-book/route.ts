import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchIdStr = searchParams.get("branchId");

    if (!branchIdStr) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    const branchId = parseInt(branchIdStr);

    let settings = await prisma.orderBookSettings.findUnique({
      where: { branchId },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.orderBookSettings.create({
        data: {
          branchId,
          numberingSettings: {
            autoGenerateOrderNumber: true,
            autoGenerateSlipNumber: true,
            prefix: "ORD-",
            financialYearReset: true,
            branchWiseNumbering: true,
            separateCustomerSlipSeries: false,
            separateWorkshopSlipSeries: false,
          },
          lifecycleSettings: {
            defaultStatus: "CREATED",
            autoStatusChange: true,
            requireRemarksBeforeCancel: true,
            allowReopenCompleted: false,
            allowReopenDelivered: false,
          },
          customerSettings: {
            allowExistingSearch: true,
            quickCreation: true,
            guestCustomer: false,
            duplicateWarning: true,
            duplicateMerge: false,
            mandatoryFields: ["Name", "Mobile"],
          },
          multiItemSettings: {
            maxItemsPerOrder: 0, // 0 = unlimited
            allowDuplicateCategory: true,
            requireFields: ["Category", "Weight"],
          },
          designSettings: {
            enableImages: true,
            maxImages: 5,
            maxFileSize: 5, // MB
            allowedFormats: ["jpg", "png", "jpeg"],
            enableVoice: true,
            maxRecordingTime: 60, // seconds
            allowMultipleRecordings: false,
          },
          deliverySettings: {
            defaultDeliveryDays: 14,
            priorityLevels: ["Standard", "Urgent", "Rush"],
            allowCustomPriority: true,
            workingDaysOnly: false,
            deliveryReminder: [7, 3, 1],
            overdueAlerts: true,
          },
          karigarAssignment: {
            autoAssignment: false,
            allowReassign: true,
            requireReason: false,
            trackHistory: true,
            onlyActive: true,
            showDepartmentFilter: true,
          },
          advanceSettings: {
            cashAdvanceEnable: true,
            minAdvancePercent: 10,
            maxAdvancePercent: 100,
            paymentModes: ["Cash", "UPI", "Card", "NEFT", "Cheque", "Wallet"],
            referenceNumberMandatory: false,
            metalAdvanceEnable: true,
            allowedMetals: ["Gold", "Silver"],
            requirePurity: true,
            requireWeight: true,
            requireRate: false,
            allowMultipleAdvances: true,
            autoUpdateCustomerMetalBalance: true,
          },
          financialRules: {
            minBookingPercent: 0,
            maxAdvancePercent: 100,
            metalAdvanceAllowed: true,
            cashAdvanceAllowed: true,
            mixedAdvanceAllowed: true,
            autoCalculateTotalAdvance: true,
            bookingExpiryDays: 30,
          },
          cancellationRules: {
            allowCancellation: true,
            requireReason: true,
            cancellationCharges: 0,
            refundRules: "Store Credit",
            restoreInventory: true,
            releaseReservedStock: true,
            returnMetalAdvance: true,
            returnWalletBalance: true,
          },
          orderNotesSettings: {
            visibilityCustomer: true,
            visibilityWorkshop: true,
            visibilityInternalOnly: true,
          },
          printingSettings: {
            customerSlip: ["Logo", "QR", "Customer Details", "Images", "Voice QR", "Delivery Date", "Notes", "Terms"],
            workshopSlip: ["Design", "Weight", "Measurement", "Karigar"], // Hidden: Price, Advance, Customer Mobile
          },
          dashboardSettings: {
            enableCards: ["Total Orders", "Active Orders", "Pending Delivery", "Metal In Process", "Total Booking Value", "Urgent Orders", "Today's Orders", "Today's Delivery", "Karigar Workload"],
          },
          notifications: {
            notifyCustomer: true,
            notifyKarigar: true,
            notifyManager: true,
            notifyAdmin: true,
            events: ["Order Created", "Order Assigned", "Order Completed", "Order Delivered", "Delivery Tomorrow", "Order Delayed", "Advance Received"],
          },
          documentSettings: {
            requireReferenceImages: false,
            requireVoiceNotes: false,
            requireCustomerSignature: false,
            requireOrderSlip: false,
            requireApprovalImage: false,
            maxUploadSize: 10,
          },
          rbacSettings: {
            // These map to the checkboxes in the plan
            managerCanDeleteOrders: false,
            managerCanModifySettings: false,
            managerCanForceCloseOrders: false,
            managerCanRestoreDeletedOrders: false,
            managerCanEditOldClosedOrders: false,
            managerCanViewOtherBranchOrders: false,
          },
          auditSettings: {
            trackStatusChange: true,
            trackAdvanceEdited: true,
            trackKarigarChanged: true,
            trackDeliveryChanged: true,
            trackItemEdited: true,
            trackCustomerChanged: true,
            trackWhoPrinted: true,
            trackWhoCancelled: true,
            trackWhoDelivered: true,
          },
          reportsSettings: {
            enableOrderRegister: true,
            enableDeliveryRegister: true,
            enableAdvanceRegister: true,
            enableMetalAdvanceRegister: true,
            enableKarigarWorkRegister: true,
            enablePendingOrders: true,
            enableCompletedOrders: true,
            enableCancelledOrders: true,
            enableCustomerHistory: true,
            enablePriorityReport: true,
            enableBranchWiseOrders: true,
          },
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch order book settings", error);
    return NextResponse.json({ error: "Failed to fetch order book settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { branchId, ...updateData } = data;

    if (!branchId) {
      return NextResponse.json({ error: "branchId is required" }, { status: 400 });
    }

    const settings = await prisma.orderBookSettings.upsert({
      where: { branchId: parseInt(branchId) },
      update: updateData,
      create: {
        branchId: parseInt(branchId),
        ...updateData,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update order book settings", error);
    return NextResponse.json({ error: "Failed to update order book settings" }, { status: 500 });
  }
}
