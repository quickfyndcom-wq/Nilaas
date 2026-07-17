
'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react";
import OrderItem from "@/components/OrderItem";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";

// TODO: Integrate Firebase Auth for user and token if needed

export default function OrdersClient() {
    // TODO: Replace with your Firebase Auth state
    // Example: const user = firebase.auth().currentUser;
    // Example: const isLoaded = !!user;
    // Example: const getToken = async () => user && user.getIdToken();
    const getToken = async () => null;
    const user = null;
    const isLoaded = true;
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true)

    const router = useRouter()

    useEffect(() => {
       const fetchOrders = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
            setOrders(data.orders)
            setLoading(false)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
       }
       if(isLoaded){
        if(user){
            fetchOrders()
        }else{
            router.push('/')
        }
       }
    }, [isLoaded, user, getToken, router]);

    if(!isLoaded || loading){
        return <Loading />
    }

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="flex justify-end my-4">
                <button
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                    onClick={() => router.push('/profile')}
                >
                    Edit Profile
                </button>
            </div>
            {orders.length > 0 ? (
                <div className="my-20 max-w-7xl mx-auto">
                    <PageTitle heading="My Orders" text={`Showing total ${orders.length} orders`} linkText={'Go to home'} />

                    {/* If you display currency here, use ₹ instead of AED*/}
                    <table className="w-full max-w-5xl text-slate-500 table-auto border-separate border-spacing-y-12 border-spacing-x-4">
                        <thead>
                            <tr className="max-sm:text-sm text-slate-600 max-md:hidden">
                                <th className="text-left">Product</th>
                                <th className="text-center">Total Price (INR)</th>
                                <th className="text-left">Address</th>
                                <th className="text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <OrderItem order={order} key={order.id} currencySymbol="₹" />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
                    <h1 className="text-2xl sm:text-4xl font-semibold">You have no orders</h1>
                </div>
            )}
        </div>
    )
}
