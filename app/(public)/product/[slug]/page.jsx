"use client"
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

function ProductPageSkeleton() {
    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-pulse">
            <div className="h-3 w-48 bg-[#e8ddd6] mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="aspect-[3/4] bg-[#e8ddd6]" />
                <div className="space-y-4 pt-2">
                    <div className="h-3 w-24 bg-[#e8ddd6]" />
                    <div className="h-10 w-4/5 bg-[#e8ddd6]" />
                    <div className="h-4 w-3/5 bg-[#e8ddd6]" />
                    <div className="h-8 w-32 bg-[#e8ddd6] mt-4" />
                    <div className="flex gap-2 mt-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-11 w-12 bg-[#e8ddd6]" />
                        ))}
                    </div>
                    <div className="h-12 w-full bg-[#e8ddd6] mt-6" />
                    <div className="h-12 w-full bg-[#e8ddd6]" />
                </div>
            </div>
        </div>
    )
}

export default function ProductBySlug() {
    const { slug } = useParams();
    const [product, setProduct] = useState();
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const products = useSelector(state => state.product.list);

    const fetchProduct = async () => {
        setLoading(true);
        let found = null;
        // Always prefer fresh product payload for visibility flags (Buy Now/Enquiry).
        try {
            const { data } = await axios.get(`/api/products/by-slug?slug=${encodeURIComponent(slug)}`);
            found = data.product || null;
        } catch {
            found = products.find((product) => product.slug === slug) || null;
        }
        setProduct(found);

        // Related products: prefer Redux, else fetch by category
        let uniqueRelated = [];
        const seen = new Set();
        const pushRelated = (list, { matchCategory = false } = {}) => {
            for (const p of list || []) {
                const key = p._id || p.id || p.slug;
                if (!key || seen.has(key)) continue;
                if (p.slug === slug || (found && (p._id === found._id || p.id === found._id))) continue;
                if (matchCategory && found) {
                    const foundCats = [
                        found.category,
                        ...(Array.isArray(found.categories) ? found.categories : []),
                    ].filter(Boolean);
                    const pCats = [
                        p.category,
                        ...(Array.isArray(p.categories) ? p.categories : []),
                    ].filter(Boolean);
                    const overlap = foundCats.some((c) => pCats.includes(c));
                    if (foundCats.length && !overlap) continue;
                }
                seen.add(key);
                uniqueRelated.push(p);
                if (uniqueRelated.length >= 12) break;
            }
        };

        if (found && products.length > 0) {
            pushRelated(products.filter((p) => p.inStock !== false), { matchCategory: true });
            if (uniqueRelated.length < 4) {
                pushRelated(products.filter((p) => p.inStock !== false), { matchCategory: false });
            }
        }

        if (found && uniqueRelated.length < 4) {
            try {
                const { data } = await axios.get(
                    `/api/products?limit=16${found.category ? `&category=${encodeURIComponent(found.category)}` : ''}`
                );
                pushRelated(data?.products || data?.list || [], { matchCategory: false });
            } catch {
                // keep whatever we have
            }
        }

        if (found && uniqueRelated.length < 4) {
            try {
                const { data } = await axios.get('/api/products?limit=16');
                pushRelated(data?.products || [], { matchCategory: false });
            } catch {
                // ignore
            }
        }

        setRelatedProducts(uniqueRelated);
        setLoading(false);
    }

    const fetchReviews = async (productId) => {
        setLoadingReviews(true);
        try {
            const { data } = await axios.get(`/api/review?productId=${productId}`);
            setReviews(data.reviews || []);
        } catch (error) {
            setReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    };

    useEffect(() => {
        fetchProduct();
        scrollTo(0, 0);
    }, [slug, products]);


    useEffect(() => {
        if (product && product._id) {
            fetchReviews(product._id);
        }
    }, [product]);

    // Track browse history for signed-in users
    useEffect(() => {
        if (!product?._id) return;

        const trackView = async (user) => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                await axios.post('/api/browse-history', 
                    { productId: product._id },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (error) {
                // Silent fail - don't interrupt user experience
                console.log('Browse history tracking failed:', error.message);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) trackView(user);
        });

        return () => unsubscribe();
    }, [product]);

    return (
        <div className="pb-24 lg:pb-0 bg-white">
            {loading ? (
                <ProductPageSkeleton />
            ) : product ? (
                <>
                    <ProductDetails product={product} reviews={reviews} loadingReviews={loadingReviews} />
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                        <ProductDescription
                            product={product}
                            reviews={reviews || []}
                            loadingReviews={loadingReviews}
                            relatedProducts={relatedProducts}
                            onReviewAdded={() => fetchReviews(product._id)}
                        />
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-[#8a6f64]">Product not found.</div>
            )}
        </div>
    );
}
