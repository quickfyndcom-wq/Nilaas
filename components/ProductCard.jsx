"use client";

import { useAuth } from "@/lib/useAuth";
import { Heart, StarIcon } from "lucide-react";
import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, uploadCart } from "@/lib/features/cart/cartSlice";
import toast from "react-hot-toast";

const ProductCard = ({ product }) => {
  const currency =
    process.env.NEXT_PUBLIC_CURRENCY_LABEL ||
    process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ||
    "₹";
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const cartItems = useSelector((state) => state.cart.cartItems);
  const itemQuantity = cartItems[product._id] || 0;

  const [reviews, setReviews] = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const cardRef = useRef(null);

  const fetchReviews = useCallback(async () => {
    if (reviewsLoaded) return;
    try {
      const { data } = await import("axios").then((ax) =>
        ax.default.get(`/api/review?productId=${product._id}`)
      );
      setReviews(data.reviews || []);
      setReviewsLoaded(true);
    } catch {
      // silent
    }
  }, [product._id, reviewsLoaded]);

  const handleCardEnter = () => fetchReviews();

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviews.length
      : typeof product.averageRating === "number"
        ? product.averageRating
        : 0;
  const ratingCount =
    reviews.length > 0
      ? reviews.length
      : typeof product.ratingCount === "number"
        ? product.ratingCount
        : 0;
  const ratingValue = Math.max(0, Math.min(5, Number(averageRating) || 0));

  const discount =
    product.AED && product.AED > product.price
      ? Math.round(((product.AED - product.price) / product.AED) * 100)
      : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ productId: product._id }));
    dispatch(uploadCart({ getToken }));
    toast.success("Added to bag");
  };

  const showCurrentPrice = Number(product.price) > 0;
  const showOriginalPrice =
    Number(product.AED) > 0 && Number(product.AED) > Number(product.price);

  const primaryImage =
    product.images &&
    Array.isArray(product.images) &&
    product.images[0] &&
    typeof product.images[0] === "string" &&
    product.images[0].trim() !== ""
      ? product.images[0]
      : "https://placehold.co/600x750?text=Nilaas";

  const secondaryImage =
    product.images &&
    Array.isArray(product.images) &&
    product.images[1] &&
    product.images[1].trim() !== ""
      ? product.images[1]
      : null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group w-full block"
      aria-label={product.name}
    >
      <article
        className="flex flex-col h-full"
        ref={cardRef}
        onMouseEnter={handleCardEnter}
        onFocus={handleCardEnter}
        tabIndex={0}
      >
        <div className="relative w-full aspect-[4/5] bg-white overflow-hidden border-0 outline-none shadow-none">
          <div
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              secondaryImage
                ? "group-hover:opacity-0"
                : "group-hover:scale-[1.03]"
            }`}
          >
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover object-center select-none"
              onError={(e) => {
                if (
                  e.currentTarget.src !==
                  "https://placehold.co/600x750?text=Nilaas"
                ) {
                  e.currentTarget.src =
                    "https://placehold.co/600x750?text=Nilaas";
                }
              }}
            />
          </div>

          {secondaryImage && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out">
              <Image
                src={secondaryImage}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-center select-none"
              />
            </div>
          )}

          {discount > 0 && (
            <span className="absolute top-0 left-0 z-10 bg-[#2a1210] text-[#faf7f4] text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1.5">
              −{discount}%
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.success("Added to wishlist");
            }}
            className="absolute top-2.5 right-2.5 z-20 flex h-9 w-9 items-center justify-center bg-white/90 text-[#2a1210] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 hover:bg-white"
            aria-label="Add to wishlist"
          >
            <Heart size={16} strokeWidth={1.5} />
          </button>

          {/* Fully hidden until hover — no peeking edge/line */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="absolute inset-x-0 bottom-0 z-20 hidden sm:flex items-center justify-center bg-[#2a1210] text-[#faf7f4] text-[11px] font-semibold uppercase tracking-[0.16em] py-3 opacity-0 translate-y-3 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 ease-out"
          >
            {itemQuantity > 0 ? `In bag (${itemQuantity})` : "Add to bag"}
          </button>
        </div>

        <div className="flex flex-col pt-3.5 gap-1.5">
          {product.category && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7d72]">
              {String(product.category).replace(/[-_]/g, " ")}
            </p>
          )}

          <h3 className="font-serif text-[15px] sm:text-base text-[#2a1210] leading-snug line-clamp-2 group-hover:text-[#6b2f28] transition-colors">
            {product.name}
          </h3>

          {ratingCount > 0 && (
            <div
              className="flex items-center gap-1.5"
              aria-label={`Rating ${ratingValue.toFixed(1)} out of 5 from ${ratingCount} reviews`}
            >
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= Math.round(ratingValue);
                  return (
                    <StarIcon
                      key={star}
                      size={11}
                      className={isFilled ? "text-[#2a1210]" : "text-[#d4c4bb]"}
                      fill={isFilled ? "currentColor" : "none"}
                    />
                  );
                })}
              </div>
              <span className="text-[11px] text-[#9a7d72]">({ratingCount})</span>
            </div>
          )}

          {(showCurrentPrice || showOriginalPrice) && (
            <div className="flex items-baseline gap-2 pt-0.5">
              {showCurrentPrice && (
                <span className="text-[15px] sm:text-base font-semibold tabular-nums text-[#2a1210]">
                  {currency}
                  {Number(product.price).toLocaleString("en-IN")}
                </span>
              )}
              {showOriginalPrice && (
                <span className="text-sm text-[#9a7d72] line-through tabular-nums">
                  {currency}
                  {Number(product.AED).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          )}

          {product.stockQuantity != null &&
            product.stockQuantity > 0 &&
            product.stockQuantity <= 3 && (
              <span className="text-[11px] text-[#6b2f28]">
                Only {product.stockQuantity} left
              </span>
            )}
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
