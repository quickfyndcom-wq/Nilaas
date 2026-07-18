"use client";

import { useAuth } from '@/lib/useAuth';
export const dynamic = 'force-dynamic'
import { useEffect, useMemo, useState } from "react"
import Loading from "@/components/Loading"

import axios from "axios"
import toast from "react-hot-toast"
import { Package, Truck, X, Download, Printer, CheckSquare } from "lucide-react"
import { downloadInvoice, printInvoice } from "@/lib/generateInvoice"
import { getPublicOrderNumber, ORDER_STATUSES } from "@/lib/orderNumber"

// Update order status (+ customer email for every status)
const updateOrderStatus = async (orderId, newStatus, getToken, fetchOrders) => {
    try {
            const token = await getToken(); // Force refresh token
        if (!token) {
            toast.error('Authentication failed. Please sign in again.');
            return;
        }
        const { data } = await axios.post('/api/store/orders/update-status', {
            orderId,
            status: newStatus
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (data?.email?.sent) {
            toast.success(`Status updated — email sent to ${data.email.to}`);
        } else {
            toast.success(data?.message || 'Order status updated');
            if (data?.email?.reason) {
                toast.error(`Customer email not sent: ${data.email.reason}`, { duration: 5000 });
            }
        }
        fetchOrders();
    } catch (error) {
        console.error('Update status error:', error);
        toast.error(error?.response?.data?.error || 'Failed to update status');
    }
};

const STATUS_BADGE = {
    PAYMENT_PENDING: 'bg-amber-100 text-amber-900',
    PAYMENT_FAILED: 'bg-red-100 text-red-800',
    ORDER_PLACED: 'bg-slate-100 text-slate-700',
    CONFIRMED: 'bg-sky-100 text-sky-800',
    PROCESSING: 'bg-amber-100 text-amber-800',
    MANIFESTED: 'bg-teal-100 text-teal-800',
    PICKUP_REQUESTED: 'bg-violet-100 text-violet-800',
    WAITING_FOR_PICKUP: 'bg-violet-100 text-violet-800',
    PICKED_UP: 'bg-indigo-100 text-indigo-800',
    WAREHOUSE_RECEIVED: 'bg-indigo-100 text-indigo-800',
    SHIPPED: 'bg-blue-100 text-blue-800',
    IN_TRANSIT: 'bg-blue-100 text-blue-900',
    OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
    UNDELIVERED: 'bg-yellow-100 text-yellow-900',
    DELIVERED: 'bg-emerald-100 text-emerald-800',
    RETURN_REQUESTED: 'bg-orange-100 text-orange-800',
    RETURNED: 'bg-orange-100 text-orange-900',
    RTO: 'bg-rose-100 text-rose-800',
    CANCELLED: 'bg-red-100 text-red-800',
};

function getPaymentDisplay(order) {
    const method = String(order?.paymentMethod || '').toUpperCase() || '—';
    const status = String(order?.paymentStatus || '').toLowerCase();
    const orderStatus = String(order?.status || '').toUpperCase();

    if (method === 'COD') {
        return { method, label: null, className: 'text-slate-600' };
    }

    if (order?.isPaid || status === 'paid') {
        return { method, label: 'Paid', className: 'text-emerald-700' };
    }
    if (status === 'failed' || orderStatus === 'PAYMENT_FAILED') {
        return { method, label: 'Failed', className: 'text-red-700' };
    }
    if (orderStatus === 'PAYMENT_PENDING' || status === 'pending' || method === 'RAZORPAY' || method === 'STRIPE') {
        return { method, label: 'Pending', className: 'text-amber-700' };
    }
    return { method, label: null, className: 'text-slate-600' };
}

// Add updateTrackingDetails function
// (must be inside the component, not top-level)




export default function StoreOrders() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [trackingData, setTrackingData] = useState({
        trackingId: '',
        trackingUrl: '',
        courier: ''
    });
    const [shippingBusy, setShippingBusy] = useState(false);
    const [labelBusy, setLabelBusy] = useState(false);
    const [pickupBusy, setPickupBusy] = useState(false);
    const [linkAwbValue, setLinkAwbValue] = useState('');
    const [pickupForm, setPickupForm] = useState({
        pickupDate: '',
        pickupTime: '14:00',
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLabelBusy, setBulkLabelBusy] = useState(false);
    const [deliveryFilter, setDeliveryFilter] = useState('ALL'); // ALL | DELIVERED | NOT_DELIVERED
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL | COD | RAZORPAY | OTHER
    const [shippingFilter, setShippingFilter] = useState('ALL'); // ALL | WITH_AWB | NO_AWB
    const [searchQuery, setSearchQuery] = useState('');
    const [statusBusy, setStatusBusy] = useState(false);
    const [syncBusy, setSyncBusy] = useState(false);

    const { user, getToken, loading: authLoading } = useAuth();

    const isDelivered = (order) => String(order?.status || '').toUpperCase() === 'DELIVERED';

    const filteredOrders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return orders.filter((o) => {
            if (deliveryFilter === 'DELIVERED' && !isDelivered(o)) return false;
            if (deliveryFilter === 'NOT_DELIVERED' && isDelivered(o)) return false;

            if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

            const pay = String(o.paymentMethod || '').toUpperCase();
            if (paymentFilter === 'COD' && pay !== 'COD') return false;
            if (paymentFilter === 'RAZORPAY' && pay !== 'RAZORPAY') return false;
            if (paymentFilter === 'OTHER' && (pay === 'COD' || pay === 'RAZORPAY' || !pay)) return false;

            const awb = Boolean(o.delhiveryWaybill || (o.courier === 'Delhivery' && o.trackingId));
            if (shippingFilter === 'WITH_AWB' && !awb) return false;
            if (shippingFilter === 'NO_AWB' && awb) return false;

            if (q) {
                const orderNo = getPublicOrderNumber(o).toLowerCase();
                const customer = (
                    o.isGuest
                        ? `${o.guestName || ''} ${o.guestEmail || ''} ${o.guestPhone || ''}`
                        : `${o.userId?.name || ''} ${o.userId?.email || ''}`
                ).toLowerCase();
                const awbStr = String(o.delhiveryWaybill || o.trackingId || '').toLowerCase();
                const addr = `${o.shippingAddress?.city || ''} ${o.shippingAddress?.phone || ''}`.toLowerCase();
                if (![orderNo, customer, awbStr, addr, String(o.status || '').toLowerCase()].some((v) => v.includes(q))) {
                    return false;
                }
            }
            return true;
        });
    }, [orders, deliveryFilter, statusFilter, paymentFilter, shippingFilter, searchQuery]);

    const filterCounts = useMemo(() => {
        const delivered = orders.filter(isDelivered).length;
        const withAwb = orders.filter((o) =>
            Boolean(o.delhiveryWaybill || (o.courier === 'Delhivery' && o.trackingId))
        ).length;
        const byStatus = {};
        let cod = 0;
        let razorpay = 0;
        for (const o of orders) {
            byStatus[o.status] = (byStatus[o.status] || 0) + 1;
            const pay = String(o.paymentMethod || '').toUpperCase();
            if (pay === 'COD') cod += 1;
            if (pay === 'RAZORPAY') razorpay += 1;
        }
        return {
            ALL: orders.length,
            DELIVERED: delivered,
            NOT_DELIVERED: orders.length - delivered,
            WITH_AWB: withAwb,
            NO_AWB: orders.length - withAwb,
            COD: cod,
            RAZORPAY: razorpay,
            byStatus,
        };
    }, [orders]);

    const clearFilters = () => {
        setDeliveryFilter('ALL');
        setStatusFilter('ALL');
        setPaymentFilter('ALL');
        setShippingFilter('ALL');
        setSearchQuery('');
    };

    const hasActiveFilters =
        deliveryFilter !== 'ALL' ||
        statusFilter !== 'ALL' ||
        paymentFilter !== 'ALL' ||
        shippingFilter !== 'ALL' ||
        searchQuery.trim() !== '';

    const hasDelhiveryAwb = (order) =>
        Boolean(order?.delhiveryWaybill || (order?.courier === 'Delhivery' && order?.trackingId));

    const getAwb = (order) =>
        order?.delhiveryWaybill || (order?.courier === 'Delhivery' ? order?.trackingId : '') || '';

    const ordersWithAwb = orders.filter(hasDelhiveryAwb);
    const selectedWithAwb = selectedIds.filter((id) =>
        hasDelhiveryAwb(orders.find((o) => o._id === id))
    );

    const toggleSelect = (orderId, e) => {
        e?.stopPropagation?.();
        setSelectedIds((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
        );
    };

    const toggleSelectAllWithAwb = () => {
        if (selectedWithAwb.length === ordersWithAwb.length && ordersWithAwb.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(ordersWithAwb.map((o) => o._id));
        }
    };

    const downloadBulkAwbPdf = async () => {
        if (selectedWithAwb.length === 0) {
            toast.error('Select orders that already have a Delhivery AWB');
            return;
        }
        try {
            setBulkLabelBusy(true);
            const token = await getToken();
            const res = await axios.post(
                '/api/store/orders/delhivery/labels-bulk',
                { orderIds: selectedWithAwb },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                }
            );
            if (res.data?.type && res.data.type.includes('json')) {
                const text = await res.data.text();
                let msg = 'Failed to download labels';
                try { msg = JSON.parse(text)?.error || msg; } catch {}
                throw new Error(msg);
            }
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `Delhivery-AWB-Labels-${selectedWithAwb.length}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success(`Downloaded ${selectedWithAwb.length} AWB label(s) · 4 per page`);
        } catch (error) {
            let msg = error?.message || 'Failed to download AWB PDF';
            const data = error?.response?.data;
            if (data instanceof Blob) {
                try {
                    const parsed = JSON.parse(await data.text());
                    msg = parsed?.error || msg;
                } catch {}
            } else if (data?.error) {
                msg = data.error;
            }
            toast.error(msg);
        } finally {
            setBulkLabelBusy(false);
        }
    };

    const applyOrderShippingUpdate = (patch) => {
        setSelectedOrder((prev) => (prev ? { ...prev, ...patch } : prev));
        if (patch.trackingId || patch.delhiveryWaybill) {
            setTrackingData({
                trackingId: patch.delhiveryWaybill || patch.trackingId || '',
                trackingUrl: patch.trackingUrl || '',
                courier: patch.courier || 'Delhivery',
            });
        }
    };

    const shipWithDelhivery = async () => {
        if (!selectedOrder) return;
        if (hasDelhiveryAwb(selectedOrder)) {
            toast.error('Delhivery AWB already exists for this order');
            return;
        }
        const payMethod = String(selectedOrder.paymentMethod || '').toUpperCase();
        if (payMethod === 'RAZORPAY' && !selectedOrder.isPaid) {
            toast.error('Cannot ship — Razorpay payment is not completed');
            return;
        }
        if (['PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(String(selectedOrder.status || '').toUpperCase())) {
            toast.error('Cannot ship — payment is still pending or failed');
            return;
        }
        if (!selectedOrder.shippingAddress?.street && !selectedOrder.shippingAddress?.address) {
            toast.error('Order has no shipping address');
            return;
        }
        try {
            setShippingBusy(true);
            const token = await getToken();
            const { data } = await axios.post(
                `/api/store/orders/${selectedOrder._id}/delhivery/ship`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Delhivery AWB created: ${data.waybill}`);
            applyOrderShippingUpdate({
                ...data.order,
                delhiveryWaybill: data.waybill,
                trackingId: data.waybill,
                trackingUrl: data.trackingUrl,
                courier: 'Delhivery',
                status: data.order?.status || 'MANIFESTED',
            });
            fetchOrders();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.error || 'Delhivery shipping failed');
        } finally {
            setShippingBusy(false);
        }
    };

    const syncStatusFromDelhivery = async () => {
        if (!selectedOrder) return;
        try {
            setSyncBusy(true);
            const token = await getToken();
            const { data } = await axios.post(
                `/api/store/orders/${selectedOrder._id}/delhivery/sync-status`,
                { notify: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedOrder((prev) => (prev ? { ...prev, ...data.order, status: data.status } : prev));
            toast.success(
                data.email?.sent
                    ? `Status → ${data.status} (from Delhivery: ${data.delhiveryStatus}). Email sent.`
                    : `Status → ${data.status} (from Delhivery: ${data.delhiveryStatus})`
            );
            fetchOrders();
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to sync status from Delhivery');
        } finally {
            setSyncBusy(false);
        }
    };

    const manualUpdateStatus = async (nextStatus) => {
        if (!selectedOrder || !nextStatus || nextStatus === selectedOrder.status) return;
        try {
            setStatusBusy(true);
            await updateOrderStatus(selectedOrder._id, nextStatus, getToken, fetchOrders);
            setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : prev));
        } finally {
            setStatusBusy(false);
        }
    };

    const linkDelhiveryAwb = async () => {
        if (!selectedOrder) return;
        const awb = linkAwbValue.trim();
        if (!awb) {
            toast.error('Enter Delhivery AWB number');
            return;
        }
        try {
            setShippingBusy(true);
            const token = await getToken();
            const { data } = await axios.post(
                `/api/store/orders/${selectedOrder._id}/delhivery/link-awb`,
                { waybill: awb },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Linked Delhivery AWB ${data.waybill}`);
            applyOrderShippingUpdate(data.order);
            setLinkAwbValue('');
            fetchOrders();
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to link AWB');
        } finally {
            setShippingBusy(false);
        }
    };

    const downloadDelhiveryAwb = async (andPrint = false) => {
        if (!selectedOrder) return;
        const awb = selectedOrder.delhiveryWaybill || selectedOrder.trackingId;
        if (!awb) {
            toast.error('No Delhivery AWB yet — ship first');
            return;
        }
        try {
            setLabelBusy(true);
            const token = await getToken();
            const res = await axios.get(
                `/api/store/orders/${selectedOrder._id}/delhivery/label`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob',
                }
            );
            if (res.data?.type && res.data.type.includes('json')) {
                const text = await res.data.text();
                let msg = 'Failed to get shipping label';
                try { msg = JSON.parse(text)?.error || msg; } catch {}
                throw new Error(msg);
            }
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            if (andPrint) {
                const w = window.open(url, '_blank');
                if (w) {
                    w.onload = () => {
                        try { w.focus(); w.print(); } catch {}
                    };
                } else {
                    toast.error('Allow popups to print the label');
                }
            } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = `Delhivery-Label-${awb}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
            setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
            toast.success(andPrint ? 'Opening shipping label…' : 'Shipping label downloaded');
        } catch (error) {
            console.error(error);
            let msg = error?.message || 'Failed to get shipping label';
            const data = error?.response?.data;
            if (data instanceof Blob) {
                try {
                    const parsed = JSON.parse(await data.text());
                    msg = parsed?.error || msg;
                } catch {}
            } else if (data?.error) {
                msg = data.error;
            }
            toast.error(msg);
        } finally {
            setLabelBusy(false);
        }
    };

    const scheduleDelhiveryPickup = async () => {
        if (!selectedOrder) return;
        if (!hasDelhiveryAwb(selectedOrder)) {
            toast.error('Create or link Delhivery AWB first');
            return;
        }
        if (!pickupForm.pickupDate) {
            toast.error('Choose a pickup date');
            return;
        }
        try {
            setPickupBusy(true);
            const token = await getToken();
            const { data } = await axios.post(
                `/api/store/orders/${selectedOrder._id}/delhivery/pickup`,
                {
                    pickupDate: pickupForm.pickupDate,
                    pickupTime: pickupForm.pickupTime || '14:00',
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(data.message || 'Pickup scheduled');
            applyOrderShippingUpdate(data.order);
            fetchOrders();
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.error || 'Failed to schedule pickup');
        } finally {
            setPickupBusy(false);
        }
    };

    // Function to update tracking details and notify customer
    const updateTrackingDetails = async () => {
        if (!selectedOrder) return;
        try {
            const token = await getToken();
            await axios.post('/api/store/orders/update-tracking', {
                orderId: selectedOrder._id,
                ...trackingData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Tracking details updated & customer notified!');
            // Optionally refresh orders or close modal
            fetchOrders();
            setIsModalOpen(false);
        } catch (error) {
            toast.error('Failed to update tracking details');
        }
    };
    // Move openModal and closeModal to top level
    const openModal = (order) => {
        console.log('[MODAL DEBUG] Opening order:', order);
        console.log('[MODAL DEBUG] Order shippingAddress:', order.shippingAddress);
        console.log('[MODAL DEBUG] Order userId type:', typeof order.userId);
        console.log('[MODAL DEBUG] Order userId value:', order.userId);
        console.log('[MODAL DEBUG] Order userId is object?:', typeof order.userId === 'object');
        if (typeof order.userId === 'object' && order.userId !== null) {
            console.log('[MODAL DEBUG] User name:', order.userId.name);
            console.log('[MODAL DEBUG] User email:', order.userId.email);
        }
        console.log('[MODAL DEBUG] Order addressId:', order.addressId);
        console.log('[MODAL DEBUG] Order isGuest:', order.isGuest);
        setSelectedOrder(order);
        setTrackingData({
            trackingId: order.trackingId || order.delhiveryWaybill || '',
            trackingUrl: order.trackingUrl || '',
            courier: order.courier || '',
        });
        setLinkAwbValue(order.delhiveryWaybill || '');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setPickupForm({
            pickupDate: order.delhiveryPickupDate || tomorrow.toISOString().slice(0, 10),
            pickupTime: (order.delhiveryPickupTime || '14:00:00').slice(0, 5),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const fetchOrders = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error("Invalid session. Please sign in again.");
                setLoading(false);
                return;
            }
            const { data } = await axios.get('/api/store/orders', {headers: { Authorization: `Bearer ${token}` }});
            console.log('[ORDERS DEBUG] Raw orders data:', data.orders);
            if (data.orders && data.orders.length > 0) {
                console.log('[ORDERS DEBUG] First order sample:', JSON.stringify(data.orders[0], null, 2));
                console.log('[ORDERS DEBUG] First order shippingAddress:', data.orders[0].shippingAddress);
                console.log('[ORDERS DEBUG] First order userId:', data.orders[0].userId);
            }
            setOrders(data.orders);
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return; // Wait for auth to load
        if (!user) {
            toast.error("You must be signed in as a seller to view orders.");
            setLoading(false);
            return;
        }
        fetchOrders();
        // eslint-disable-next-line
    }, [authLoading, user]);

    if (authLoading || loading) return <Loading />;

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h1 className="text-2xl text-slate-500">
                    Store <span className="text-slate-800 font-medium">Orders</span>
                </h1>
                {ordersWithAwb.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleSelectAllWithAwb}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            <CheckSquare size={16} />
                            {selectedWithAwb.length === ordersWithAwb.length && ordersWithAwb.length > 0
                                ? 'Clear selection'
                                : `Select all with AWB (${ordersWithAwb.length})`}
                        </button>
                        <button
                            type="button"
                            onClick={downloadBulkAwbPdf}
                            disabled={bulkLabelBusy || selectedWithAwb.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2a1210] text-white text-sm font-semibold rounded-lg hover:bg-[#4a221c] disabled:opacity-50"
                            title="Download selected AWBs as PDF — 4 labels per A4 page"
                        >
                            <Download size={16} />
                            {bulkLabelBusy
                                ? 'Preparing PDF…'
                                : `Download AWB PDF${selectedWithAwb.length ? ` (${selectedWithAwb.length})` : ''}`}
                        </button>
                    </div>
                )}
            </div>

            {selectedIds.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5">
                    <Truck size={16} className="text-orange-600" />
                    <span>
                        <strong>{selectedIds.length}</strong> selected
                        {selectedWithAwb.length > 0 && (
                            <> · <strong>{selectedWithAwb.length}</strong> with Delhivery AWB</>
                        )}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs text-slate-500">PDF prints 4 shipping labels per A4 page</span>
                    <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        className="ml-auto text-xs font-semibold text-orange-700 hover:underline"
                    >
                        Clear
                    </button>
                </div>
            )}

            {orders.length > 0 && (
                <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">Filters</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>
                                Showing <strong className="text-slate-800">{filteredOrders.length}</strong> of {orders.length}
                            </span>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="font-semibold text-orange-700 hover:underline"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Primary: All / Delivered / Not delivered */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'ALL', label: 'All', count: filterCounts.ALL },
                            { key: 'DELIVERED', label: 'Delivered', count: filterCounts.DELIVERED },
                            { key: 'NOT_DELIVERED', label: 'Not delivered', count: filterCounts.NOT_DELIVERED },
                        ].map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => {
                                    setDeliveryFilter(f.key);
                                    if (f.key === 'DELIVERED') setStatusFilter('ALL');
                                }}
                                className={`text-sm font-semibold px-3.5 py-2 rounded-lg border transition-colors ${
                                    deliveryFilter === f.key
                                        ? f.key === 'DELIVERED'
                                            ? 'bg-emerald-700 text-white border-emerald-700'
                                            : f.key === 'NOT_DELIVERED'
                                              ? 'bg-amber-700 text-white border-amber-700'
                                              : 'bg-[#2a1210] text-white border-[#2a1210]'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                            >
                                {f.label} ({f.count})
                            </button>
                        ))}
                    </div>

                    {/* Search + detail filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                                Search
                            </label>
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Order ID, customer, AWB, phone…"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                                Status detail
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setStatusFilter(v);
                                    if (v === 'DELIVERED') setDeliveryFilter('DELIVERED');
                                    else if (v !== 'ALL' && deliveryFilter === 'DELIVERED') setDeliveryFilter('NOT_DELIVERED');
                                }}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                            >
                                <option value="ALL">All statuses</option>
                                {ORDER_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label} ({filterCounts.byStatus[s.value] || 0})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                                Payment
                            </label>
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                            >
                                <option value="ALL">All payments</option>
                                <option value="COD">COD ({filterCounts.COD})</option>
                                <option value="RAZORPAY">Razorpay ({filterCounts.RAZORPAY})</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                                Shipping / AWB
                            </label>
                            <select
                                value={shippingFilter}
                                onChange={(e) => setShippingFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                            >
                                <option value="ALL">All shipping</option>
                                <option value="WITH_AWB">With Delhivery AWB ({filterCounts.WITH_AWB})</option>
                                <option value="NO_AWB">Not manifested ({filterCounts.NO_AWB})</option>
                            </select>
                        </div>
                    </div>

                    {/* Quick status chips for details */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                        <span className="text-[11px] font-semibold uppercase text-slate-400 self-center mr-1">Status</span>
                        {ORDER_STATUSES.filter((s) => filterCounts.byStatus[s.value]).map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => {
                                    setStatusFilter(s.value);
                                    if (s.value === 'DELIVERED') setDeliveryFilter('DELIVERED');
                                    else if (deliveryFilter === 'DELIVERED') setDeliveryFilter('NOT_DELIVERED');
                                }}
                                className={`text-[11px] font-semibold px-2 py-1 rounded-md border transition-colors ${
                                    statusFilter === s.value
                                        ? 'bg-[#2a1210] text-white border-[#2a1210]'
                                        : `bg-white border-slate-200 hover:border-slate-300 ${STATUS_BADGE[s.value] || 'text-slate-600'}`
                                }`}
                            >
                                {s.label} ({filterCounts.byStatus[s.value]})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {orders.length === 0 ? (
                <p>No orders found</p>
            ) : filteredOrders.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-slate-600 text-sm mb-2">No orders match these filters</p>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="text-sm font-semibold text-orange-700 hover:underline"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto w-full rounded-md shadow border border-gray-200">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-3 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={
                                            ordersWithAwb.length > 0 &&
                                            selectedWithAwb.length === ordersWithAwb.length
                                        }
                                        onChange={toggleSelectAllWithAwb}
                                        className="rounded border-gray-300"
                                        title="Select all orders with AWB"
                                    />
                                </th>
                                <th className="px-4 py-3">Sr.</th>
                                <th className="px-4 py-3">Order ID</th>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Shipping</th>
                                <th className="px-4 py-3">Total</th>
                                <th className="px-4 py-3">Payment</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map((order, index) => {
                                const awb = getAwb(order);
                                const hasAwb = Boolean(awb);
                                const isSelected = selectedIds.includes(order._id);
                                const orderNo = getPublicOrderNumber(order);
                                const statusKnown = ORDER_STATUSES.some((s) => s.value === order.status);
                                return (
                                <tr
                                    key={order._id}
                                    className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-orange-50/60' : ''}`}
                                    onClick={() => openModal(order)}
                                >
                                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            disabled={!hasAwb}
                                            onChange={(e) => toggleSelect(order._id, e)}
                                            className="rounded border-gray-300 disabled:opacity-30"
                                            title={hasAwb ? 'Select for bulk AWB download' : 'Ship with Delhivery first'}
                                        />
                                    </td>
                                    <td className="pl-2 text-green-600">{index + 1}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-700" title={`Order ID / Delhivery ref: ${order.delhiveryOrderRef || orderNo}`}>
                                        {orderNo}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-slate-800">
                                                {order.isGuest 
                                                    ? (order.guestName || 'Guest User')
                                                    : (order.userId?.name || order.userId?.email || 'Unknown')}
                                            </span>
                                            {order.isGuest && (
                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full w-fit font-semibold">
                                                    Guest
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                            {hasAwb ? (
                                                <>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                                        <Truck size={10} />
                                                        AWB
                                                    </span>
                                                    <span className="inline-flex items-center font-mono text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded" title={awb}>
                                                        {awb}
                                                    </span>
                                                    {['MANIFESTED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'UNDELIVERED', 'DELIVERED', 'RTO', 'RETURN_REQUESTED', 'RETURNED', 'PICKED_UP', 'PICKUP_REQUESTED'].includes(order.status) && (
                                                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${STATUS_BADGE[order.status] || 'bg-blue-100 text-blue-800'}`}>
                                                            {ORDER_STATUSES.find((s) => s.value === order.status)?.label || order.status}
                                                        </span>
                                                    )}
                                                    {order.delhiveryPickupDate && (
                                                        <span className="text-[10px] font-semibold uppercase bg-violet-100 text-violet-800 px-2 py-0.5 rounded">
                                                            Pickup {order.delhiveryPickupDate}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                                    Not manifested
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-800">{currency}{order.total}</td>
                                    <td className="px-4 py-3">
                                        {(() => {
                                            const pay = getPaymentDisplay(order);
                                            return (
                                                <div className="leading-tight">
                                                    <div className="font-medium text-slate-800">{pay.method}</div>
                                                    {pay.label && (
                                                        <div className={`text-[11px] font-semibold uppercase tracking-wide ${pay.className}`}>
                                                            {pay.label}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); }}>
                                        <select
                                            value={order.status || 'ORDER_PLACED'}
                                            onChange={e => updateOrderStatus(order._id, e.target.value, getToken, fetchOrders)}
                                            title="Update status — customer receives an email"
                                            className={`border border-gray-300 rounded-md text-sm focus:ring focus:ring-blue-200 min-w-[170px] max-w-[220px] ${STATUS_BADGE[order.status] || ''}`}
                                        >
                                            {!statusKnown && order.status && (
                                                <option value={order.status}>{order.status}</option>
                                            )}
                                            <optgroup label="Store">
                                                {ORDER_STATUSES.filter((s) => s.group === 'store').map((s) => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Delhivery">
                                                {ORDER_STATUSES.filter((s) => s.group === 'delhivery').map((s) => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Returns">
                                                {ORDER_STATUSES.filter((s) => s.group === 'return').map((s) => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {isModalOpen && selectedOrder && (
                <div onClick={closeModal} className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm text-slate-700 text-sm z-50 p-4" >
                    <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Order Details</h2>
                                    <p className="text-blue-100 text-xs">
                                        Order ID: <span className="font-mono text-white">{getPublicOrderNumber(selectedOrder)}</span>
                                    </p>
                                    {hasDelhiveryAwb(selectedOrder) && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded">
                                                AWB {getAwb(selectedOrder)}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase bg-emerald-400/90 text-emerald-950 px-2 py-0.5 rounded">
                                                Delhivery
                                            </span>
                                            {selectedOrder.delhiveryPickupDate && (
                                                <span className="text-[10px] font-bold uppercase bg-violet-300/90 text-violet-950 px-2 py-0.5 rounded">
                                                    Pickup {selectedOrder.delhiveryPickupDate}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => downloadInvoice(selectedOrder)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                                        title="Download Invoice"
                                    >
                                        <Download size={18} />
                                        <span className="text-sm">Download</span>
                                    </button>
                                    <button
                                        onClick={() => printInvoice(selectedOrder)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                                        title="Print Invoice"
                                    >
                                        <Printer size={18} />
                                        <span className="text-sm">Print</span>
                                    </button>
                                    {!hasDelhiveryAwb(selectedOrder) ? (
                                        <button
                                            type="button"
                                            onClick={shipWithDelhivery}
                                            disabled={shippingBusy}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-[#2a1210] hover:bg-white/90 font-semibold rounded-lg transition-colors shadow disabled:opacity-50"
                                            title="Create Delhivery shipment & AWB"
                                        >
                                            <Truck size={18} />
                                            <span className="text-sm">{shippingBusy ? 'Shipping…' : 'Ship Delhivery'}</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => downloadDelhiveryAwb(true)}
                                            disabled={labelBusy}
                                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow disabled:opacity-50"
                                            title="Print Delhivery shipping label"
                                        >
                                            <Printer size={18} />
                                            <span className="text-sm">{labelBusy ? 'Preparing…' : 'Print label'}</span>
                                        </button>
                                    )}
                                    <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Manual status (ecommerce + Delhivery aligned) */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">Order status</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Update manually anytime — customer gets an email. Or sync from Delhivery scans.
                                        </p>
                                    </div>
                                    {hasDelhiveryAwb(selectedOrder) && (
                                        <button
                                            type="button"
                                            onClick={syncStatusFromDelhivery}
                                            disabled={syncBusy}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-orange-300 text-orange-800 text-sm font-semibold rounded-lg hover:bg-orange-50 disabled:opacity-50"
                                        >
                                            <Truck size={16} />
                                            {syncBusy ? 'Syncing…' : 'Sync from Delhivery'}
                                        </button>
                                    )}
                                </div>
                                <select
                                    value={selectedOrder.status || 'ORDER_PLACED'}
                                    disabled={statusBusy}
                                    onChange={(e) => manualUpdateStatus(e.target.value)}
                                    className={`w-full border-2 border-slate-300 rounded-lg text-sm font-semibold py-2.5 px-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 ${STATUS_BADGE[selectedOrder.status] || 'bg-white'}`}
                                >
                                    {!ORDER_STATUSES.some((s) => s.value === selectedOrder.status) && selectedOrder.status && (
                                        <option value={selectedOrder.status}>{selectedOrder.status}</option>
                                    )}
                                    <optgroup label="Store">
                                        {ORDER_STATUSES.filter((s) => s.group === 'store').map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Delhivery / Shipping">
                                        {ORDER_STATUSES.filter((s) => s.group === 'delhivery').map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Returns">
                                        {ORDER_STATUSES.filter((s) => s.group === 'return').map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </optgroup>
                                </select>
                                {selectedOrder.delhiveryLastStatus && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        Last Delhivery scan: <span className="font-medium text-slate-700">{selectedOrder.delhiveryLastStatus}</span>
                                        {selectedOrder.delhiveryLastSyncedAt
                                            ? ` · synced ${new Date(selectedOrder.delhiveryLastSyncedAt).toLocaleString()}`
                                            : ''}
                                    </p>
                                )}
                            </div>

                            {/* Delhivery shipping */}
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                        <Truck size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-orange-900">Delhivery shipping</h3>
                                        <p className="text-xs text-orange-800/80">AWB, shipping label &amp; pickup schedule</p>
                                    </div>
                                </div>

                                {hasDelhiveryAwb(selectedOrder) ? (
                                    <div className="bg-white rounded-lg p-4 mb-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Delhivery AWB</p>
                                                <p className="font-semibold text-slate-900 font-mono text-sm">
                                                    {selectedOrder.delhiveryWaybill || selectedOrder.trackingId}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Courier</p>
                                                <p className="font-semibold text-slate-900">Delhivery</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Track</p>
                                                <a
                                                    href={selectedOrder.trackingUrl || `https://www.delhivery.com/track/package/${selectedOrder.delhiveryWaybill || selectedOrder.trackingId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline font-medium text-sm"
                                                >
                                                    Open tracking
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => downloadDelhiveryAwb(false)}
                                                disabled={labelBusy}
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a1210] text-white text-sm font-medium rounded-lg hover:bg-[#4a221c] disabled:opacity-50"
                                            >
                                                <Download size={16} />
                                                {labelBusy ? 'Preparing…' : 'Download shipping label'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => downloadDelhiveryAwb(true)}
                                                disabled={labelBusy}
                                                className="inline-flex items-center gap-2 px-3 py-2 border border-[#2a1210] text-[#2a1210] text-sm font-medium rounded-lg hover:bg-[#faf7f4] disabled:opacity-50"
                                            >
                                                <Printer size={16} />
                                                Print shipping label
                                            </button>
                                        </div>

                                        <div className="border-t border-slate-100 pt-4">
                                            <p className="text-sm font-semibold text-slate-800 mb-2">Schedule pickup</p>
                                            {selectedOrder.delhiveryPickupDate ? (
                                                <p className="text-sm text-green-700 mb-3">
                                                    Pickup set for <strong>{selectedOrder.delhiveryPickupDate}</strong>
                                                    {selectedOrder.delhiveryPickupTime ? ` at ${selectedOrder.delhiveryPickupTime}` : ''}
                                                    {selectedOrder.delhiveryPickupId ? ` · ID ${selectedOrder.delhiveryPickupId}` : ''}
                                                </p>
                                            ) : null}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                                <div>
                                                    <label className="text-xs font-medium text-slate-700 block mb-1">Pickup date</label>
                                                    <input
                                                        type="date"
                                                        value={pickupForm.pickupDate}
                                                        min={new Date().toISOString().slice(0, 10)}
                                                        onChange={(e) => setPickupForm((p) => ({ ...p, pickupDate: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-slate-700 block mb-1">Pickup time</label>
                                                    <input
                                                        type="time"
                                                        value={pickupForm.pickupTime}
                                                        onChange={(e) => setPickupForm((p) => ({ ...p, pickupTime: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={scheduleDelhiveryPickup}
                                                    disabled={pickupBusy || !pickupForm.pickupDate}
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                                                >
                                                    <Truck size={16} />
                                                    {pickupBusy ? 'Scheduling…' : 'Add to pickup'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg p-4 mb-4 space-y-4">
                                        <p className="text-sm text-slate-600">
                                            Create a Delhivery shipment to get the official AWB, then print the shipping label and choose a pickup date.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={shipWithDelhivery}
                                            disabled={shippingBusy}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2a1210] text-white text-sm font-semibold rounded-lg hover:bg-[#4a221c] disabled:opacity-50"
                                        >
                                            <Truck size={16} />
                                            {shippingBusy ? 'Creating AWB…' : 'Ship with Delhivery (get AWB)'}
                                        </button>
                                        <div className="border-t border-slate-100 pt-4">
                                            <p className="text-xs text-slate-500 mb-2">Already created in Delhivery panel? Link AWB here:</p>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    value={linkAwbValue}
                                                    onChange={(e) => setLinkAwbValue(e.target.value)}
                                                    placeholder="e.g. 46671410009962"
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={linkDelhiveryAwb}
                                                    disabled={shippingBusy || !linkAwbValue.trim()}
                                                    className="px-4 py-2 border border-[#2a1210] text-[#2a1210] text-sm font-semibold rounded-lg hover:bg-[#faf7f4] disabled:opacity-50"
                                                >
                                                    Link AWB
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-700 block mb-1">Tracking ID *</label>
                                        <input
                                            type="text"
                                            value={trackingData.trackingId}
                                            onChange={e => setTrackingData({...trackingData, trackingId: e.target.value})}
                                            placeholder="Enter tracking ID"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-700 block mb-1">Courier Name *</label>
                                        <input
                                            type="text"
                                            value={trackingData.courier}
                                            onChange={e => setTrackingData({...trackingData, courier: e.target.value})}
                                            placeholder="e.g., FedEx, DHL, UPS"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-700 block mb-1">Tracking URL</label>
                                        <input
                                            type="url"
                                            value={trackingData.trackingUrl}
                                            onChange={e => setTrackingData({...trackingData, trackingUrl: e.target.value})}
                                            placeholder="https://..."
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={updateTrackingDetails}
                                    className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition-colors"
                                >
                                    Update Tracking & Notify Customer
                                </button>
                            </div>

                            {/* Customer Details */}
                            <div className="bg-slate-50 rounded-xl p-5">
                                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                                    Customer Details
                                    {selectedOrder.isGuest && (
                                        <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                                            GUEST ORDER
                                        </span>
                                    )}
                                </h3>
                                
                                {!selectedOrder.shippingAddress && !selectedOrder.isGuest && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                        <p className="text-yellow-800 text-sm">
                                            ⚠️ Shipping address not available for this order. This order was placed before address tracking was implemented.
                                        </p>
                                        {selectedOrder.userId && (
                                            <p className="text-yellow-700 text-xs mt-2">
                                                Customer: {selectedOrder.userId.name || selectedOrder.userId.email || 'Unknown'}
                                            </p>
                                        )}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-500">Name</p>
                                        <p className="font-medium text-slate-900">
                                            {selectedOrder.isGuest 
                                                ? (selectedOrder.guestName || '—') 
                                                : (selectedOrder.shippingAddress?.name || selectedOrder.userId?.name || '—')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Email</p>
                                        <p className="font-medium text-slate-900">
                                            {selectedOrder.isGuest 
                                                ? (selectedOrder.guestEmail || '—') 
                                                : (selectedOrder.shippingAddress?.email || selectedOrder.userId?.email || '—')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Phone</p>
                                        <p className="font-medium text-slate-900">
                                            {selectedOrder.isGuest 
                                                ? (selectedOrder.guestPhone || '—') 
                                                : (selectedOrder.shippingAddress?.phone || '—')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Street</p>
                                        <p className="font-medium text-slate-900">{selectedOrder.shippingAddress?.street || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">City</p>
                                        <p className="font-medium text-slate-900">{selectedOrder.shippingAddress?.city || '—'}</p>
                                    </div>
                                    {selectedOrder.shippingAddress?.district && selectedOrder.shippingAddress.district.trim() !== '' && (
                                        <div>
                                            <p className="text-slate-500">District</p>
                                            <p className="font-medium text-slate-900">{selectedOrder.shippingAddress.district}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-slate-500">State</p>
                                        <p className="font-medium text-slate-900">{selectedOrder.shippingAddress?.state || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Pincode</p>
                                        <p className="font-medium text-slate-900">{selectedOrder.shippingAddress?.zip || selectedOrder.shippingAddress?.pincode || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Country</p>
                                        <p className="font-medium text-slate-900">{selectedOrder.shippingAddress?.country || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            <div>
                                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-green-600 rounded-full"></div>
                                    Order Items
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.orderItems.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 border border-slate-200 rounded-xl p-3 bg-white hover:shadow-md transition-shadow">
                                            <img
                                                src={item.productId?.images?.[0] || item.product?.images?.[0] || '/placeholder.png'}
                                                alt={item.productId?.name || item.product?.name || 'Product'}
                                                className="w-20 h-20 object-cover rounded-lg border border-slate-100"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{item.name || item.productId?.name || item.product?.name || 'Unknown Product'}</p>
                                                <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                                                <p className="text-sm font-semibold text-slate-900">{currency}{item.price} each</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-slate-900">{currency}{item.price * item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment & Status */}
                            <div className="bg-slate-50 rounded-xl p-5">
                                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <div className="w-1 h-5 bg-purple-600 rounded-full"></div>
                                    Payment & Status
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-500">Total Amount</p>
                                        <p className="text-xl font-bold text-slate-900">{currency}{selectedOrder.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Payment Method</p>
                                        <p className="font-medium text-slate-900">{selectedOrder.paymentMethod}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Payment Status</p>
                                        {(() => {
                                            const pay = getPaymentDisplay(selectedOrder);
                                            const label =
                                                pay.label ||
                                                (String(selectedOrder.paymentMethod || '').toUpperCase() === 'COD'
                                                    ? 'Collect on delivery'
                                                    : '—');
                                            return (
                                                <p className={`font-medium ${pay.className}`}>
                                                    {label}
                                                    {selectedOrder.paymentFailureReason
                                                        ? ` — ${selectedOrder.paymentFailureReason}`
                                                        : ''}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                    {selectedOrder.isCouponUsed && (
                                        <div>
                                            <p className="text-slate-500">Coupon Used</p>
                                            <p className="font-medium text-green-600">{selectedOrder.coupon.code} ({selectedOrder.coupon.discount}% off)</p>
                                        </div>
                                    )}
                                    <div className="col-span-2 md:col-span-1">
                                        <p className="text-slate-500 mb-1">Order Status</p>
                                        <select
                                            value={selectedOrder.status || 'ORDER_PLACED'}
                                            disabled={statusBusy}
                                            onChange={(e) => manualUpdateStatus(e.target.value)}
                                            className={`w-full border border-gray-300 rounded-md text-sm py-1.5 px-2 ${STATUS_BADGE[selectedOrder.status] || ''}`}
                                        >
                                            {!ORDER_STATUSES.some((s) => s.value === selectedOrder.status) && (
                                                <option value={selectedOrder.status}>{selectedOrder.status}</option>
                                            )}
                                            {ORDER_STATUSES.map((s) => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Order Date</p>
                                        <p className="font-medium text-slate-900">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
                                        try {
                                            const token = await getToken();
                                            await axios.delete(`/api/store/orders/${selectedOrder._id}`, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            toast.success('Order deleted successfully');
                                            setIsModalOpen(false);
                                            fetchOrders();
                                        } catch (error) {
                                            toast.error(error?.response?.data?.error || 'Failed to delete order');
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow backdrop-blur-sm"
                                    title="Delete Order"
                                >
                                    <X size={18} />
                                    <span className="text-sm">Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
