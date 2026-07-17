'use client'
import { assets } from "@/assets/assets"

import axios from "axios"
import Image from "next/image"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent } from '@tiptap/react'
import { createPortal } from 'react-dom'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Node, mergeAttributes } from '@tiptap/core'

import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

import { useAuth } from '@/lib/useAuth';
import { FASHION_COLOR_OPTIONS, colorToSwatch, isLightSwatch } from '@/lib/fashion-colors'

// Custom Video Extension for Tiptap
const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
      width: {
        default: '100%',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: true })]
  },

  addCommands() {
    return {
      setVideo: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})

export const dynamic = 'force-dynamic'

export default function ProductForm({ product = null, onClose, onSubmitSuccess }) {
    const router = useRouter()
    const [dbCategories, setDbCategories] = useState([])
    const colorOptions = FASHION_COLOR_OPTIONS
    const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size', '28', '30', '32', '34', '36', '38', '40', '42']
    const fashionTagSuggestions = [
        'Ethnic', 'Western', 'Festive', 'Wedding', 'Casual', 'Party', 'Office',
        'Cotton', 'Silk', 'Georgette', 'Linen', 'Embroidered', 'Printed', 'Solid',
        'New Arrival', 'Bestseller', 'Sale',
    ]
    const fashionBadges = [
        'New Arrival', 'Best Seller', 'Trending', 'Festive Special',
        'Limited Edition', 'Hot Deal', 'Sale', 'Free Shipping',
    ]

    const [images, setImages] = useState({ "1": null, "2": null, "3": null, "4": null, "5": null, "6": null, "7": null, "8": null })
    const [productInfo, setProductInfo] = useState({
        name: "",
        slug: "",
        brand: "Nilaas",
        shortDescription: "",
        description: "",
        AED: "",
        price: "",
        category: "",
        categories: [],
        sku: "",
        stockQuantity: '',
        colors: [],
        sizes: [],
        fastDelivery: false,
        allowReturn: true,
        allowReplacement: true,
        enquiryOnly: false,
        showBuyButton: true,
        showEnquiryButton: true,
        reviews: [],
        badges: [],
        tags: [],
        goldType: '',
        goldPurityKarat: '22',
        goldWeight: '',
        goldRate: '',
        stoneType: '',
        stoneWeight: '',
        stonePrice: '',
        makingCharges: '',
        makingChargePercent: '',
        vatPercent: '5'
    })
    // Variants state
    const [hasVariants, setHasVariants] = useState(false)
    const [variants, setVariants] = useState([]) // { options: {color, size[, bundleQty]}, price, AED, stock, sku?, tag? }
    // Bulk bundle variant helper state (UI sugar over variants JSON)
    const [bulkEnabled, setBulkEnabled] = useState(false)
    const [bulkOptions, setBulkOptions] = useState([
        { title: 'Buy 1', qty: 1, price: '', AED: '', stock: 0, tag: '' },
        { title: 'Bundle of 2', qty: 2, price: '', AED: '', stock: 0, tag: 'MOST_POPULAR' },
        { title: 'Bundle of 3', qty: 3, price: '', AED: '', stock: 0, tag: '' },
    ])
    const [reviewInput, setReviewInput] = useState({ name: "", rating: 5, comment: "", image: null })
    const [loading, setLoading] = useState(false)
    const [useCalculatedPrice, setUseCalculatedPrice] = useState(false)
    const [liveMetalPrices, setLiveMetalPrices] = useState(null)
    const [fetchingPrice, setFetchingPrice] = useState(false)
    // Stones UI helpers (local only, not sent to API)
    const [stonePriceMode, setStonePriceMode] = useState('total') // 'total' | 'per-carat'
    const [stonePricePerCarat, setStonePricePerCarat] = useState('')

    // Dynamic details (Metal / General)
    const [metalDetails, setMetalDetails] = useState([]) // [{label, value}]
    const [generalDetails, setGeneralDetails] = useState([]) // [{label, value}]

    // AI autofill (image + seller notes → listing details, never price)
    const [aiNotes, setAiNotes] = useState('')
    const [aiIncludeVariants, setAiIncludeVariants] = useState(true)
    const [aiLoading, setAiLoading] = useState(false)

    // Fetch live metal prices
    const fetchLiveMetalPrice = async (metalType, karat) => {
        setFetchingPrice(true);
        try {
            const response = await fetch('/api/gold-rate');
            const data = await response.json();
            console.log('Gold Rate API Response:', data);
            
            if (data?.rates) {
                const karatValue = karat || productInfo.goldPurityKarat || '22';
                let rateToUse = data.rates.perGram22K; // default
                
                if (karatValue == '24') rateToUse = data.rates.perGram24K;
                else if (karatValue == '18') rateToUse = data.rates.perGram18K;
                else if (karatValue == '22') rateToUse = data.rates.perGram22K;
                
                console.log(`Selected rate for ${karatValue}K:`, rateToUse);
                
                setLiveMetalPrices({
                    pricePerGram: rateToUse,
                    timestamp: Date.now() / 1000,
                    karat: karatValue
                });
                // Auto-fill gold rate
                setProductInfo(p => ({ ...p, goldRate: rateToUse }));
            }
        } catch (error) {
            console.error('Failed to fetch metal price:', error);
        } finally {
            setFetchingPrice(false);
        }
    };

    // Auto-fetch live price when gold type or karat changes
    useEffect(() => {
        if (productInfo.goldType && useCalculatedPrice) {
            fetchLiveMetalPrice(productInfo.goldType, productInfo.goldPurityKarat);
        }
    }, [productInfo.goldType, productInfo.goldPurityKarat, useCalculatedPrice]);

    // Initial fetch on mount if auto-calculate is enabled
    useEffect(() => {
        if (useCalculatedPrice && productInfo.goldType) {
            fetchLiveMetalPrice(productInfo.goldType);
        }
    }, []);

    // Auto-calculate price from gold/stone details
    useEffect(() => {
        if (useCalculatedPrice) {
            const goldWeight = Number(productInfo.goldWeight) || 0;
            const goldRate = Number(productInfo.goldRate) || 0;
            const stonePrice = Number(productInfo.stonePrice) || 0;
            const makingPercent = Number(productInfo.makingChargePercent) || 0;
            const vatPercent = Number(productInfo.vatPercent) || 0;
            
            const goldValue = goldWeight * goldRate;
            const subtotal = goldValue + stonePrice;
            const makingCharges = (subtotal * makingPercent) / 100;
            const subtotalWithMaking = subtotal + makingCharges;
            const vat = (subtotalWithMaking * vatPercent) / 100;
            const calculatedPrice = subtotalWithMaking + vat;
            
            if (calculatedPrice > 0) {
                setProductInfo(p => ({ 
                    ...p, 
                    makingCharges: makingCharges.toFixed(2),
                    price: calculatedPrice.toFixed(2), 
                    AED: calculatedPrice.toFixed(2) 
                }));
            }
        }
    }, [useCalculatedPrice, productInfo.goldWeight, productInfo.goldRate, productInfo.stonePrice, productInfo.makingChargePercent, productInfo.vatPercent]);

    // When in per-carat mode, auto-compute total stone price
    useEffect(() => {
        if (stonePriceMode === 'per-carat') {
            const c = Number(productInfo.stoneWeight) || 0
            const p = Number(stonePricePerCarat) || 0
            const total = c > 0 && p > 0 ? (c * p) : 0
            setProductInfo(prev => ({ ...prev, stonePrice: total ? String(total) : '' }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stonePriceMode, productInfo.stoneWeight, stonePricePerCarat])


    const { user, loading: authLoading, getToken } = useAuth();

    // Fetch categories from database
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/store/categories');
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('Failed to fetch categories:', res.status, res.statusText, errorData);
                    return;
                }
                
                const data = await res.json();
                if (data.categories) {
                    setDbCategories(data.categories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                // Set empty array as fallback
                setDbCategories([]);
            }
        };
        // Fetch categories immediately without waiting for auth
        fetchCategories();
    }, []);

    // Tiptap editor for description
    const editor = useEditor({
        extensions: [
            StarterKit,
            TiptapImage.configure({
                inline: true,
                allowBase64: true,
            }),
            Video,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder: 'AI will add a detailed story with highlights and tables (specs + size guide)…'
            })
        ],
        content: productInfo.description,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            setProductInfo(prev => ({ ...prev, description: editor.getHTML() }))
        }
    })

    // Update editor content when product changes
    useEffect(() => {
        if (editor && product?.description) {
            // Use setTimeout to ensure editor is ready
            setTimeout(() => {
                if (editor.getHTML() !== product.description) {
                    editor.commands.setContent(product.description, false)
                }
            }, 100)
        }
    }, [product?.description, editor])

    const fileToCompressedBase64 = (file, maxWidth = 1280, quality = 0.82) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = () => reject(new Error('Failed to read image'))
            reader.onload = () => {
                const img = new window.Image()
                img.onload = () => {
                    const scale = Math.min(1, maxWidth / img.width)
                    const w = Math.round(img.width * scale)
                    const h = Math.round(img.height * scale)
                    const canvas = document.createElement('canvas')
                    canvas.width = w
                    canvas.height = h
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, w, h)
                    const dataUrl = canvas.toDataURL('image/jpeg', quality)
                    resolve({
                        base64: dataUrl.replace(/^data:[^;]+;base64,/, ''),
                        mimeType: 'image/jpeg',
                    })
                }
                img.onerror = () => reject(new Error('Invalid image'))
                img.src = reader.result
            }
            reader.readAsDataURL(file)
        })

    const getFirstImageForAi = async () => {
        const entry = Object.values(images).find(Boolean)
        if (!entry) return null
        if (entry?.file instanceof File) {
            return fileToCompressedBase64(entry.file)
        }
        const url = typeof entry === 'string' ? entry : entry?.preview
        if (!url) return null
        const res = await fetch(url)
        const blob = await res.blob()
        const file = new File([blob], 'product.jpg', { type: blob.type || 'image/jpeg' })
        return fileToCompressedBase64(file)
    }

    const runAiAutofill = async () => {
        try {
            setAiLoading(true)
            const imgPayload = await getFirstImageForAi()
            if (!imgPayload) {
                toast.error('Upload at least one product image first')
                return
            }
            const token = await getToken(true)
            if (!token) {
                toast.error('Please sign in again')
                return
            }
            const { data } = await axios.post(
                '/api/store/product-autofill',
                {
                    imageBase64: imgPayload.base64,
                    mimeType: imgPayload.mimeType,
                    notes: aiNotes,
                    includeVariants: aiIncludeVariants,
                    brand: productInfo.brand || 'Nilaas',
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (!data?.success || !data.product) {
                throw new Error(data?.error || 'AI autofill failed')
            }
            const p = data.product

            setProductInfo((prev) => {
                const name = p.name || prev.name
                const slug = name
                    ? name
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-+|-+$/g, '')
                    : prev.slug
                return {
                    ...prev,
                    name,
                    slug,
                    brand: p.brand || prev.brand || 'Nilaas',
                    shortDescription: p.shortDescription || prev.shortDescription,
                    description: p.description || prev.description,
                    category: p.category || prev.category,
                    categories: Array.isArray(p.categories) && p.categories.length
                        ? p.categories
                        : p.category
                            ? [p.category]
                            : prev.categories,
                    tags: Array.isArray(p.tags) && p.tags.length ? p.tags : prev.tags,
                    badges: Array.isArray(p.badges) && p.badges.length ? p.badges : prev.badges,
                    colors: Array.isArray(p.colors) && p.colors.length ? p.colors : prev.colors,
                    sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : prev.sizes,
                    sku: p.sku || prev.sku,
                    stockQuantity:
                        p.stockQuantity !== undefined && p.stockQuantity !== null
                            ? p.stockQuantity
                            : prev.stockQuantity,
                    // never touch price / AED
                }
            })

            if (Array.isArray(p.fabricDetails) && p.fabricDetails.length) {
                setMetalDetails(
                    p.fabricDetails
                        .filter((d) => d?.label || d?.value)
                        .map((d) => ({ label: d.label || '', value: d.value || '' }))
                )
            }
            if (Array.isArray(p.generalDetails) && p.generalDetails.length) {
                setGeneralDetails(
                    p.generalDetails
                        .filter((d) => d?.label || d?.value)
                        .map((d) => ({ label: d.label || '', value: d.value || '' }))
                )
            }

            if (p.description && editor) {
                // Rich HTML with tables from AI
                editor.commands.setContent(p.description, false)
                setProductInfo((prev) => ({ ...prev, description: editor.getHTML() }))
            }

            if (aiIncludeVariants && Array.isArray(p.variants) && p.variants.length) {
                setHasVariants(true)
                setBulkEnabled(false)
                setVariants(
                    p.variants.map((v) => ({
                        options: {
                            color: v.color || '',
                            size: v.size || '',
                            title: [v.color, v.size].filter(Boolean).join(' / '),
                        },
                        sku: v.sku || '',
                        stock: Number(v.stock) >= 0 ? Number(v.stock) : 5,
                        price: '',
                        AED: '',
                        image: '',
                    }))
                )
                toast('Fill sale price & MRP on each variant card', { icon: '₹' })
            }

            toast.success('AI filled product details (price left blank for you)')
        } catch (err) {
            console.error(err)
            toast.error(err?.response?.data?.error || err.message || 'AI autofill failed')
        } finally {
            setAiLoading(false)
        }
    }

    // Prefill form when editing
    useEffect(() => {
        if (product) {
            setProductInfo({
                name: product.name || "",
                slug: product.slug || "",
                brand: product.brand || "",
                shortDescription: product.shortDescription || "",
                description: product.description || "",
                AED: product.AED || "",
                price: product.price || "",
                category: product.category || "",
                categories: Array.isArray(product.categories) && product.categories.length
                    ? product.categories
                    : product.category
                        ? [product.category]
                        : [],
                sku: product.sku || "",
                stockQuantity: product.stockQuantity ?? '',
                colors: product.colors || [],
                sizes: product.sizes || [],
                fastDelivery: product.fastDelivery || false,
                allowReturn: product.allowReturn !== undefined ? product.allowReturn : true,
                allowReplacement: product.allowReplacement !== undefined ? product.allowReplacement : true,
                enquiryOnly: product.enquiryOnly || false,
                showBuyButton: product.showBuyButton !== undefined ? product.showBuyButton : true,
                showEnquiryButton: product.showEnquiryButton !== undefined ? product.showEnquiryButton : true,
                reviews: product.reviews || [],
                badges: product.attributes?.badges || [],
                tags: product.tags || [],
                goldType: product.goldType || '',
                goldWeight: product.goldWeight || '',
                goldRate: product.goldRate || '',
                stoneWeight: product.stoneWeight || '',
                stonePrice: product.stonePrice || '',
                makingCharges: product.makingCharges || ''
            })
            // Init stone per-carat UI from attributes if present
            const mode = product.attributes?.stonePriceMode
            if (mode === 'per-carat' || mode === 'total') {
                setStonePriceMode(mode)
            }
            const perCarat = product.attributes?.stonePricePerCarat
            if (perCarat) setStonePricePerCarat(String(perCarat))
            const pv = Array.isArray(product.variants) ? product.variants : []
            setHasVariants(Boolean(product.hasVariants))
            setVariants(
                pv.map((v) => ({
                    ...v,
                    price: v.price ?? '',
                    AED: v.AED ?? '',
                    stock: v.stock ?? 0,
                    sku: v.sku || '',
                    image: v.image || '',
                    options: v.options || {},
                }))
            )
            // Detect bulk bundle style variants (presence of options.bundleQty)
            const isBulk = pv.length > 0 && pv.every(v => v?.options && (v.options.bundleQty || v.options.bundleQty === 0) && !v.options.color && !v.options.size)
            if (isBulk) {
                setBulkEnabled(true)
                // Map into editable bulkOptions
                const mapped = pv.map(v => ({
                    title: v?.options?.title || (Number(v?.options?.bundleQty) === 1 ? 'Buy 1' : `Bundle of ${Number(v?.options?.bundleQty) || 1}`),
                    qty: Number(v?.options?.bundleQty) || 1,
                    price: v.price ?? '',
                    AED: v.AED ?? v.price ?? '',
                    stock: v.stock ?? 0,
                    tag: v.tag || v.options?.tag || ''
                }))
                // Keep sorted by qty
                mapped.sort((a,b)=>a.qty-b.qty)
                setBulkOptions(mapped)
            }
            // Map existing images to slots - store as strings (URLs)
            const imgState = { "1": null, "2": null, "3": null, "4": null, "5": null, "6": null, "7": null, "8": null }
            if (product.images && Array.isArray(product.images)) {
                product.images.forEach((img, i) => {
                    if (i < 8) imgState[String(i + 1)] = img // Keep as string URL
                })
            }
            setImages(imgState)

            // Prefill dynamic details from product or local overrides
            try {
                const map = JSON.parse(localStorage.getItem('productDetailsOverrides') || '{}')
                const override = product._id ? map[product._id] : null
                setMetalDetails(Array.isArray(product.metalDetails) && product.metalDetails.length ? product.metalDetails : (override?.metalDetails || []))
                setGeneralDetails(Array.isArray(product.generalDetails) && product.generalDetails.length ? product.generalDetails : (override?.generalDetails || []))
            } catch {}
        }
    }, [product])

    const updateDetail = (setter) => (idx, field, val) => {
        setter(prev => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)))
    }
    const addDetailRow = (setter) => () => setter(prev => [...prev, { label: '', value: '' }])
    const removeDetailRow = (setter) => (idx) => setter(prev => prev.filter((_, i) => i !== idx))

    const onChangeHandler = (e) => {
        const { name, value } = e.target
        
        // Auto-generate slug from product name
        if (name === 'name') {
            const slug = value
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            
            setProductInfo(prev => ({ 
                ...prev, 
                [name]: value,
                slug: slug 
            }))
        } else {
            setProductInfo(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleImageUpload = async (key, file) => {
        // Create preview URL for the file
        const previewUrl = URL.createObjectURL(file)
        setImages(prev => ({ ...prev, [key]: { file, preview: previewUrl } }))
    }

    const updateVariant = (idx, patch) => {
        setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)))
    }

    const updateVariantOption = (idx, field, value) => {
        setVariants((prev) =>
            prev.map((v, i) => {
                if (i !== idx) return v
                const options = { ...(v.options || {}), [field]: value }
                const title = [options.color, options.size].filter(Boolean).join(' / ')
                return { ...v, options: { ...options, title } }
            })
        )
    }

    const buildVariantsFromColorsSizes = () => {
        const colors = productInfo.colors.length ? productInfo.colors : ['Default']
        const sizes = productInfo.sizes.length ? productInfo.sizes : ['Free Size']
        if (colors.length * sizes.length > 48) {
            toast.error('Too many combinations. Pick fewer colors/sizes (max 48 variants).')
            return
        }
        const base = (productInfo.sku || 'NL').toString().trim() || 'NL'
        const existing = new Map(
            variants.map((v) => [
                `${(v.options?.color || '').toLowerCase()}|${(v.options?.size || '').toLowerCase()}`,
                v,
            ])
        )
        const rows = []
        for (const color of colors) {
            for (const size of sizes) {
                const key = `${color.toLowerCase()}|${size.toLowerCase()}`
                const prev = existing.get(key)
                if (prev) {
                    rows.push(prev)
                    continue
                }
                const colorCode = color.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'CLR'
                const sizeCode = String(size).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'SZ'
                rows.push({
                    options: { color, size, title: `${color} / ${size}` },
                    sku: `${base}-${colorCode}-${sizeCode}`,
                    price: '',
                    AED: '',
                    stock: 5,
                    image: '',
                })
            }
        }
        setHasVariants(true)
        setBulkEnabled(false)
        setVariants(rows)
        toast.success(`Built ${rows.length} variants — fill sale price & MRP for each`)
        // Scroll to variants section after paint
        setTimeout(() => {
            document.getElementById('variants-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    const handleVariantImageUpload = async (idx, file) => {
        if (!file) return
        const preview = URL.createObjectURL(file)
        updateVariant(idx, { imagePreview: preview, imageUploading: true })
        try {
            const token = await getToken(true)
            if (!token) throw new Error('Please sign in again')
            const body = new FormData()
            body.append('file', file)
            body.append('folder', 'variant-images')
            const res = await fetch('/api/s3/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body,
            })
            const data = await res.json()
            if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed')
            updateVariant(idx, { image: data.url, imagePreview: data.url, imageUploading: false })
            toast.success('Variant image uploaded')
        } catch (err) {
            updateVariant(idx, { imageUploading: false })
            toast.error(err.message || 'Variant image upload failed')
        }
    }

    const handleImageDelete = async (key) => {
        setImages(prev => {
            const updated = { ...prev, [key]: null };

            // If editing an existing product, persist the change
            if (product && product._id) {
                // Collect all non-null images (string URLs only)
                const newImages = Object.values(updated)
                    .filter(img => typeof img === 'string' && img)
                ;
                (async () => {
                    try {
                        const token = await getToken();
                        await axios.put('/api/store/product', {
                            productId: product._id,
                            images: newImages
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        toast.success('Image deleted and saved!');
                    } catch (err) {
                        toast.error('Failed to delete image on server');
                    }
                })();
            }
            return updated;
        });
    }

    const addReview = () => {
        if (!reviewInput.name || !reviewInput.comment) return toast.error("Please fill all review fields")
        setProductInfo(prev => ({ ...prev, reviews: [...prev.reviews, reviewInput] }))
        setReviewInput({ name: "", rating: 5, comment: "", image: null })
        toast.success("Review added ✅")
    }

    const removeReview = (index) => {
        setProductInfo(prev => ({ ...prev, reviews: prev.reviews.filter((_, i) => i !== index) }))
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        try {
            const hasImage = Object.values(images).some(img => img)
            if (!hasImage) return toast.error('Please upload at least one product image')

            setLoading(true)
            const formData = new FormData()

            // Ensure primary category matches first selected multi-category
            const selectedCategories = Array.isArray(productInfo.categories)
                ? productInfo.categories.filter(Boolean)
                : []
            if (selectedCategories.length === 0) {
                toast.error('Select at least one fashion category')
                setLoading(false)
                return
            }

            Object.entries({
                ...productInfo,
                category: selectedCategories[0],
                categories: selectedCategories,
            }).forEach(([key, value]) => {
                if (["colors", "sizes", "categories"].includes(key)) {
                    formData.append(key, JSON.stringify(value))
                } else if (key === 'reviews') {
                    const cleanReviews = value.map(({ name, rating, comment }) => ({ name, rating, comment }))
                    formData.append('reviews', JSON.stringify(cleanReviews))
                } else if (key === 'tags') {
                    formData.append('tags', JSON.stringify(value))
                } else if (key === 'slug') {
                    formData.append('slug', value.trim())
                } else {
                    formData.append(key, value)
                }
            })

            // Attributes bucket for extra details
            const attributes = {
                brand: productInfo.brand,
                shortDescription: productInfo.shortDescription,
                badges: productInfo.badges || [],
                ...(bulkEnabled ? { variantType: 'bulk_bundles' } : {})
            }
            // Include dynamic details for future server support
            attributes.metalDetails = metalDetails
            attributes.generalDetails = generalDetails
            // Persist stone pricing meta in attributes
            attributes.stonePriceMode = stonePriceMode
            if (stonePriceMode === 'per-carat' && stonePricePerCarat) {
                attributes.stonePricePerCarat = Number(stonePricePerCarat)
            }
            formData.append('attributes', JSON.stringify(attributes))
            
            // Price Breakup fields
            if (productInfo.goldType) formData.append('goldType', productInfo.goldType)
            if (productInfo.goldWeight) formData.append('goldWeight', productInfo.goldWeight)
            if (productInfo.goldRate) formData.append('goldRate', productInfo.goldRate)
            if (productInfo.stoneWeight) formData.append('stoneWeight', productInfo.stoneWeight)
            if (productInfo.stonePrice) formData.append('stonePrice', productInfo.stonePrice)
            if (productInfo.makingCharges) formData.append('makingCharges', productInfo.makingCharges)

            // Also send as top-level fields (API may accept these directly)
            formData.append('metalDetails', JSON.stringify(metalDetails))
            formData.append('generalDetails', JSON.stringify(generalDetails))

            // Variants — each needs sale price + MRP when enabled
            let variantsToSend = variants
            let hasVariantsFlag = hasVariants
            if (bulkEnabled) {
                variantsToSend = bulkOptions
                    .filter(b => Number(b.qty) > 0 && Number(b.price) > 0)
                    .map(b => ({
                        options: { bundleQty: Number(b.qty), title: (b.title || undefined), tag: b.tag || undefined },
                        price: Number(b.price),
                        AED: Number(b.AED || b.price),
                        stock: Number(b.stock || 0),
                    }))
                hasVariantsFlag = variantsToSend.length > 0
                if (variantsToSend.length > 0 && (!productInfo.price || !productInfo.AED)) {
                    formData.set('price', String(variantsToSend[0].price))
                    formData.set('AED', String(variantsToSend[0].AED))
                }
            } else if (hasVariantsFlag) {
                const incomplete = variants.find(
                    (v) => !Number(v.price) || !Number(v.AED || v.price)
                )
                if (!variants.length) {
                    toast.error('Add at least one variant, or turn variants off')
                    setLoading(false)
                    return
                }
                if (incomplete) {
                    toast.error('Every variant needs Sale price and MRP')
                    setLoading(false)
                    document.getElementById('variants-section')?.scrollIntoView({ behavior: 'smooth' })
                    return
                }
                variantsToSend = variants.map((v) => ({
                    options: {
                        color: v.options?.color || '',
                        size: v.options?.size || '',
                        title: v.options?.title || [v.options?.color, v.options?.size].filter(Boolean).join(' / '),
                    },
                    sku: v.sku || '',
                    price: Number(v.price),
                    AED: Number(v.AED || v.price),
                    stock: Number(v.stock || 0),
                    image: typeof v.image === 'string' ? v.image : '',
                }))
                // Derive product base price from cheapest variant
                const prices = variantsToSend.map((v) => v.price).filter((n) => n > 0)
                const mrps = variantsToSend.map((v) => v.AED).filter((n) => n > 0)
                if (prices.length) {
                    formData.set('price', String(Math.min(...prices)))
                    formData.set('AED', String(Math.min(...(mrps.length ? mrps : prices))))
                }
                const totalStock = variantsToSend.reduce((s, v) => s + (Number(v.stock) || 0), 0)
                formData.set('stockQuantity', String(totalStock))
            }
            formData.append('hasVariants', String(hasVariantsFlag))
            if (hasVariantsFlag) {
                formData.append('variants', JSON.stringify(variantsToSend))
            }

            Object.keys(images).forEach(key => {
                const img = images[key]
                if (img) {
                    // If it's an object with file property (new upload), use the file
                    // If it's a string (existing image URL), append as 'images' too
                    if (img.file) {
                        formData.append('images', img.file)
                    } else if (typeof img === 'string') {
                        formData.append('images', img)
                    }
                }
            })

            productInfo.reviews.forEach((rev, index) => {
                if (rev.image) formData.append(`reviewImages_${index}`, rev.image)
            })

            // Add productId for edit mode
            if (product?._id) {
                formData.append('productId', product._id)
            }

            let token = await getToken()
            // Retry once with forceRefresh to handle expired tokens
            if (!token) {
                token = await getToken(true)
            }
            if (!token) {
                toast.error('Authentication required. Please sign in again.')
                setLoading(false)
                return
            }
            const apiCall = product
                ? axios.put(`/api/store/product`, formData, { headers: { Authorization: `Bearer ${token}` } })
                : axios.post('/api/store/product', formData, { headers: { Authorization: `Bearer ${token}` } })

            const { data } = await apiCall
            toast.success(data.message)
            // Call success callback if provided
            if (onSubmitSuccess) {
                onSubmitSuccess(data.product || data.updatedProduct)
            }
            // Persist dynamic details to localStorage overrides so ProductDetails can read them
            try {
                const saved = data.product || data.updatedProduct || product
                if (saved && saved._id) {
                    const map = JSON.parse(localStorage.getItem('productDetailsOverrides') || '{}')
                    map[saved._id] = { metalDetails, generalDetails }
                    localStorage.setItem('productDetailsOverrides', JSON.stringify(map))
                }
            } catch {}
            // Always close modal (if any) and navigate to manage-product
            if (onClose) {
                onClose()
            }
            router.push('/store/manage-product')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">
                Checking session...
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-center shadow-sm">
                    <p className="text-sm font-semibold text-amber-800">Session expired. Please sign in again to add products.</p>
                    <div className="mt-3 flex justify-center">
                        <button
                            onClick={() => router.push('/login')}
                            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Check if this is being used as a modal (when onClose is provided)
    const isModal = !!onClose

    const content = (
        <div className={isModal ? "fixed inset-0 z-[1000] isolate flex items-center justify-center bg-black/60 p-4 overflow-y-auto" : "min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-slate-50 py-8 px-4"}>
            <div className={isModal ? "relative z-[1001] w-full max-w-4xl my-8 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto" : "max-w-6xl mx-auto"}>
                <form onSubmit={onSubmitHandler} className={isModal ? "space-y-6 p-8" : "space-y-8"}>
                    {/* Header */}
                    <div className={isModal ? "flex items-center justify-between mb-6 pb-4 border-b border-rose-100" : "flex items-center justify-between mb-8"}>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Nilaas · nilaas.in</p>
                            <h1 className={isModal ? "text-2xl font-bold text-slate-900" : "text-4xl font-bold text-slate-900"}>{product ? "Edit fashion product" : "Add fashion product"}</h1>
                            {!isModal && <p className="text-slate-600 mt-2">List kurtis, sarees, dresses, co-ords and more for your ladies fashion store</p>}
                        </div>
                        <button 
                            type="button" 
                            onClick={() => onClose ? onClose() : router.back()} 
                            className="text-slate-600 hover:text-slate-900 text-2xl"
                        >
                            ✕
                        </button>
                    </div>

                    {/* AI Autofill */}
                    <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-md">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">AI assist</p>
                                <h2 className="text-xl font-bold text-slate-900">Fill details from image</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Upload a photo, add anything you know, then AI fills name, category, tags, colors, sizes, a detailed story with tables (specs + size guide), and optional variants.
                                    <span className="font-medium text-rose-800"> Price is never filled</span> — you set MRP / selling price yourself.
                                </p>
                            </div>
                        </div>

                        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {['1', '2', '3', '4'].map((key) => {
                                const img = images[key]
                                const hasImage = img && (img.preview || typeof img === 'string')
                                return (
                                    <label
                                        key={key}
                                        className="relative flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-rose-200 bg-white hover:border-rose-400"
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(key, e.target.files[0])}
                                        />
                                        {hasImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={img.preview || img}
                                                alt={`Product ${key}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="px-2 text-center text-xs text-slate-500">
                                                {key === '1' ? 'Main photo *' : `Photo ${key}`}
                                            </span>
                                        )}
                                    </label>
                                )
                            })}
                        </div>

                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Extra details you know (optional)
                        </label>
                        <textarea
                            value={aiNotes}
                            onChange={(e) => setAiNotes(e.target.value)}
                            rows={3}
                            className="mb-3 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            placeholder="e.g. Cotton kurti, pink floral, sizes S–XL, festive wear, fabric soft, brand Nilaas…"
                        />

                        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-rose-100 bg-white p-3">
                            <input
                                type="checkbox"
                                checked={aiIncludeVariants}
                                onChange={(e) => setAiIncludeVariants(e.target.checked)}
                                className="mt-1 h-4 w-4"
                            />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Also generate size / color variants</p>
                                <p className="text-xs text-slate-500">
                                    Creates color × size rows with SKU &amp; stock suggestions (no prices). You can edit after.
                                </p>
                            </div>
                        </label>

                        <button
                            type="button"
                            disabled={aiLoading}
                            onClick={runAiAutofill}
                            className="inline-flex items-center justify-center rounded-xl bg-rose-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-900 disabled:opacity-60"
                        >
                            {aiLoading ? 'Analyzing image…' : 'AI fill product details'}
                        </button>
                    </div>

                    {/* Section 1: Basic Info */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border-l-4 border-rose-700">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-rose-800 text-white px-3 py-1 rounded-full text-sm">1</span>
                            Product information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Product name *</label>
                                <input name="name" value={productInfo.name} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="e.g. Floral print cotton kurti" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Brand</label>
                                <input name="brand" value={productInfo.brand} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="Nilaas" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Fashion categories *
                                    <span className="ml-2 font-normal text-slate-500">(select one or more)</span>
                                </label>
                                {Array.isArray(productInfo.categories) && productInfo.categories.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {productInfo.categories.map((name) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => {
                                                    setProductInfo((prev) => {
                                                        const next = (prev.categories || []).filter((c) => c !== name)
                                                        return {
                                                            ...prev,
                                                            categories: next,
                                                            category: next[0] || '',
                                                        }
                                                    })
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-sm border border-rose-200 hover:bg-rose-100"
                                            >
                                                {name}
                                                <span className="text-rose-500" aria-hidden>×</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="max-h-56 overflow-y-auto border-2 border-slate-200 rounded-lg p-3 bg-white space-y-3">
                                    {dbCategories.filter((cat) => !cat.parentId).map((cat) => (
                                        <div key={cat._id}>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={(productInfo.categories || []).includes(cat.name)}
                                                    onChange={() => {
                                                        setProductInfo((prev) => {
                                                            const current = Array.isArray(prev.categories) ? [...prev.categories] : []
                                                            const exists = current.includes(cat.name)
                                                            const next = exists
                                                                ? current.filter((c) => c !== cat.name)
                                                                : [...current, cat.name]
                                                            return {
                                                                ...prev,
                                                                categories: next,
                                                                category: next[0] || '',
                                                            }
                                                        })
                                                    }}
                                                    className="rounded border-slate-300 text-rose-700 focus:ring-rose-500"
                                                />
                                                <span className="text-sm font-semibold text-slate-800 group-hover:text-rose-800">{cat.name}</span>
                                            </label>
                                            {(cat.children || []).length > 0 && (
                                                <div className="mt-1.5 ml-6 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                    {cat.children.map((child) => (
                                                        <label key={child._id} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={(productInfo.categories || []).includes(child.name)}
                                                                onChange={() => {
                                                                    setProductInfo((prev) => {
                                                                        const current = Array.isArray(prev.categories) ? [...prev.categories] : []
                                                                        const exists = current.includes(child.name)
                                                                        const next = exists
                                                                            ? current.filter((c) => c !== child.name)
                                                                            : [...current, child.name]
                                                                        return {
                                                                            ...prev,
                                                                            categories: next,
                                                                            category: next[0] || '',
                                                                        }
                                                                    })
                                                                }}
                                                                className="rounded border-slate-300 text-rose-700 focus:ring-rose-500"
                                                            />
                                                            <span className="text-sm text-slate-700">{child.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {dbCategories.length === 0 && (
                                        <p className="text-xs text-rose-700">
                                            No categories yet — set them up in{' '}
                                            <a href="/store/categories" className="underline font-medium">Fashion Categories</a>.
                                        </p>
                                    )}
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    First selected category is used as the primary listing category.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">SKU</label>
                                <input name="sku" value={productInfo.sku || ""} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="e.g. NL-KURTI-001" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Stock quantity *</label>
                                <input 
                                    type="number" 
                                    name="stockQuantity" 
                                    value={productInfo.stockQuantity ?? ''} 
                                    onChange={onChangeHandler} 
                                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" 
                                    placeholder="0" 
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Product slug <span className="text-xs font-normal text-rose-700">(auto-generated)</span></label>
                                <input 
                                    name="slug" 
                                    value={productInfo.slug} 
                                    readOnly 
                                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 text-slate-600 cursor-not-allowed" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Colors & sizes */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border-l-4 border-rose-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-sm">1.5</span>
                            Colors & sizes
                        </h2>
                        <p className="mb-6 text-sm text-slate-600">Select available options for this garment. Customers will see these on the product page.</p>
                        <div className="space-y-6">
                            <div>
                                <label className="mb-3 block text-sm font-semibold text-slate-700">Available colors</label>
                                <div className="flex flex-wrap gap-2">
                                    {colorOptions.map((color) => {
                                        const selected = productInfo.colors.includes(color)
                                        const swatch = colorToSwatch(color)
                                        const light = isLightSwatch(color)
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                title={color}
                                                onClick={() => {
                                                    setProductInfo((p) => ({
                                                        ...p,
                                                        colors: selected
                                                            ? p.colors.filter((c) => c !== color)
                                                            : [...p.colors, color],
                                                    }))
                                                }}
                                                className={`inline-flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 text-xs font-medium transition border ${
                                                    selected
                                                        ? 'border-[#2a1210] bg-[#2a1210] text-white ring-2 ring-[#2a1210]/20'
                                                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                                                }`}
                                            >
                                                <span
                                                    className={`h-6 w-6 shrink-0 rounded-full border ${
                                                        light ? 'border-slate-300' : 'border-black/10'
                                                    } ${selected ? 'ring-2 ring-white' : ''}`}
                                                    style={{ background: swatch }}
                                                    aria-hidden
                                                />
                                                {color}
                                                {selected ? <span className="opacity-80">✓</span> : null}
                                            </button>
                                        )
                                    })}
                                </div>
                                {productInfo.colors.length > 0 && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                        <span className="font-medium text-slate-700">Selected:</span>
                                        {productInfo.colors.map((color) => (
                                            <span key={color} className="inline-flex items-center gap-1.5">
                                                <span
                                                    className={`h-3.5 w-3.5 rounded-full border ${
                                                        isLightSwatch(color) ? 'border-slate-300' : 'border-transparent'
                                                    }`}
                                                    style={{ background: colorToSwatch(color) }}
                                                />
                                                {color}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="mb-3 block text-sm font-semibold text-slate-700">Available sizes</label>
                                <div className="flex flex-wrap gap-2">
                                    {sizeOptions.map((size) => {
                                        const selected = productInfo.sizes.includes(size)
                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => {
                                                    setProductInfo((p) => ({
                                                        ...p,
                                                        sizes: selected
                                                            ? p.sizes.filter((s) => s !== size)
                                                            : [...p.sizes, size],
                                                    }))
                                                }}
                                                className={`min-w-[2.75rem] rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                                    selected
                                                        ? 'bg-rose-800 text-white'
                                                        : 'border border-slate-200 bg-white text-slate-700 hover:border-rose-400'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="rounded-xl border-2 border-rose-200 bg-rose-50/50 p-4 space-y-3">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={hasVariants}
                                        onChange={(e) => {
                                            const on = e.target.checked
                                            setHasVariants(on)
                                            if (on) setBulkEnabled(false)
                                            else setVariants([])
                                        }}
                                        className="mt-1 h-5 w-5"
                                    />
                                    <div>
                                        <span className="font-semibold text-slate-900">This product has variants (color / size)</span>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            Each color × size gets its own sale price, MRP, SKU, stock, and photo.
                                        </p>
                                    </div>
                                </label>
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHasVariants(true)
                                            setBulkEnabled(false)
                                            buildVariantsFromColorsSizes()
                                        }}
                                        className="inline-flex items-center justify-center rounded-xl bg-rose-800 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-900"
                                    >
                                        Set individual variant prices
                                    </button>
                                    {hasVariants && variants.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                document
                                                    .getElementById('variants-section')
                                                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                            }
                                            className="inline-flex items-center justify-center rounded-xl border-2 border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-rose-900 hover:bg-rose-50"
                                        >
                                            Go to variant price list ({variants.length})
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">
                                    Select colors &amp; sizes above, then click the button. Fill sale price + MRP on each card that appears.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Variant individual prices — right after colors/sizes */}
                    {hasVariants && (
                    <div id="variants-section" className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border-l-4 border-rose-700">
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <span className="bg-rose-800 text-white px-3 py-1 rounded-full text-sm">1.6</span>
                                    Variant prices (individual)
                                </h2>
                                <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                                    Enter <strong>sale price</strong> and <strong>MRP</strong> for each color × size, plus SKU, stock, and optional photo.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={buildVariantsFromColorsSizes}
                                    className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
                                >
                                    Rebuild from colors × sizes
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setVariants([
                                            ...variants,
                                            {
                                                options: { color: '', size: '', title: '' },
                                                sku: '',
                                                price: '',
                                                AED: '',
                                                stock: 5,
                                                image: '',
                                            },
                                        ])
                                    }
                                    className="rounded-lg bg-rose-800 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-900"
                                >
                                    + Add one variant
                                </button>
                            </div>
                        </div>

                        {variants.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-6 py-10 text-center">
                                <p className="font-medium text-slate-800">No variants yet</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Select colors &amp; sizes above, then click <strong>Build variants</strong>.
                                </p>
                                <button
                                    type="button"
                                    onClick={buildVariantsFromColorsSizes}
                                    className="mt-4 rounded-lg bg-rose-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-900"
                                >
                                    Build variants from colors × sizes
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {variants.map((v, idx) => {
                                    const imgSrc = v.imagePreview || v.image || ''
                                    const missingPrice = !Number(v.price) || !Number(v.AED || v.price)
                                    return (
                                        <div
                                            key={idx}
                                            className={`rounded-2xl border-2 p-4 sm:p-5 ${
                                                missingPrice ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50/80'
                                            }`}
                                        >
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                                                        Variant {idx + 1}
                                                    </p>
                                                    <p className="font-semibold text-slate-900">
                                                        {v.options?.title ||
                                                            [v.options?.color, v.options?.size].filter(Boolean).join(' / ') ||
                                                            'Untitled variant'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                                                    onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                                                >
                                                    Remove
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[120px_1fr]">
                                                {/* Variant image */}
                                                <div>
                                                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                                                        Variant image
                                                    </label>
                                                    <label className="relative flex h-28 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-rose-200 bg-white hover:border-rose-400">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) =>
                                                                e.target.files?.[0] &&
                                                                handleVariantImageUpload(idx, e.target.files[0])
                                                            }
                                                        />
                                                        {imgSrc ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={imgSrc} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="px-2 text-center text-[11px] text-slate-500">
                                                                {v.imageUploading ? 'Uploading…' : 'Upload photo'}
                                                            </span>
                                                        )}
                                                    </label>
                                                    {imgSrc && (
                                                        <button
                                                            type="button"
                                                            className="mt-1 text-xs text-red-600 hover:underline"
                                                            onClick={() =>
                                                                updateVariant(idx, { image: '', imagePreview: '' })
                                                            }
                                                        >
                                                            Clear image
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    <div>
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">Color *</label>
                                                        <input
                                                            className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
                                                            placeholder="e.g. Pink"
                                                            value={v.options?.color || ''}
                                                            onChange={(e) => updateVariantOption(idx, 'color', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">Size *</label>
                                                        <input
                                                            className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
                                                            placeholder="e.g. M"
                                                            value={v.options?.size || ''}
                                                            onChange={(e) => updateVariantOption(idx, 'size', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">SKU *</label>
                                                        <input
                                                            className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
                                                            placeholder="NL-PNK-M"
                                                            value={v.sku || ''}
                                                            onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                                                            Sale price (₹) *
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₹</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                className="w-full rounded-lg border-2 border-slate-200 py-2 pl-7 pr-3 text-sm focus:border-rose-500 focus:outline-none"
                                                                placeholder="1499"
                                                                value={v.price ?? ''}
                                                                onChange={(e) => updateVariant(idx, { price: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                                                            MRP (₹) *
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₹</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                className="w-full rounded-lg border-2 border-slate-200 py-2 pl-7 pr-3 text-sm focus:border-rose-500 focus:outline-none"
                                                                placeholder="1999"
                                                                value={v.AED ?? ''}
                                                                onChange={(e) => updateVariant(idx, { AED: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">Stock *</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
                                                            placeholder="5"
                                                            value={v.stock ?? 0}
                                                            onChange={(e) =>
                                                                updateVariant(idx, { stock: Number(e.target.value) })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {missingPrice && (
                                                <p className="mt-3 text-xs font-medium text-amber-800">
                                                    Fill sale price and MRP for this variant before saving.
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}

                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                                    <span>{variants.length} variant(s)</span>
                                    <button
                                        type="button"
                                        className="font-semibold text-rose-800 hover:underline"
                                        onClick={() => {
                                            const first = variants.find((v) => Number(v.price) && Number(v.AED))
                                            if (!first) {
                                                toast.error('Fill one complete variant first, then apply to all')
                                                return
                                            }
                                            setVariants((prev) =>
                                                prev.map((v) => ({
                                                    ...v,
                                                    price: v.price || first.price,
                                                    AED: v.AED || first.AED,
                                                }))
                                            )
                                            toast.success('Copied prices onto empty variants')
                                        }}
                                    >
                                        Copy first prices → empty variants
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    )}

                    {/* Section 2: Pricing */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border-l-4 border-emerald-600">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="bg-emerald-700 text-white px-3 py-1 rounded-full text-sm">2</span>
                            Pricing (INR)
                        </h2>
                        {hasVariants ? (
                            <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                Variants are on — set <strong>sale price</strong> and <strong>MRP</strong> on each variant card above.
                                Base prices here are optional fallbacks only.
                            </p>
                        ) : (
                            <p className="mb-6 text-sm text-slate-600">Set MRP and selling price for this fashion item.</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    MRP (₹) {hasVariants ? '(optional)' : '*'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
                                    <input type="number" step="0.01" name="AED" value={productInfo.AED} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 pl-12 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition" placeholder="1999" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Sale price (₹) {hasVariants ? '(optional)' : '*'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
                                    <input type="number" step="0.01" name="price" value={productInfo.price} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 pl-12 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition" placeholder="1499" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Descriptions & Tags */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border-l-4 border-rose-600">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-rose-700 text-white px-3 py-1 rounded-full text-sm">3</span>
                            Description & tags
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Short description</label>
                                <input name="shortDescription" value={productInfo.shortDescription} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="e.g. Soft cotton kurti for everyday & festive wear" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Fashion tags</label>
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {fashionTagSuggestions.filter((t) => !productInfo.tags.includes(t)).slice(0, 12).map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setProductInfo((p) => ({ ...p, tags: [...p.tags, tag] }))}
                                            className="rounded-full border border-rose-200 bg-rose-50/60 px-3 py-1 text-xs font-medium text-rose-900 hover:border-rose-400"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 mb-3 flex-wrap">
                                    {productInfo.tags.map((tag, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-800 text-sm font-medium">
                                            {tag}
                                            <button type="button" className="text-rose-500 hover:text-rose-700 font-bold" onClick={() => setProductInfo(p=>({ ...p, tags: p.tags.filter((_,i)=>i!==idx) }))}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        id="tagInput"
                                        className="flex-1 border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition"
                                        placeholder="Type tag (Festive, Cotton, etc.) and press Enter"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault();
                                                const val = e.currentTarget.value.trim();
                                                if (val && !productInfo.tags.includes(val)) {
                                                    setProductInfo(p=>({ ...p, tags: [...p.tags, val] }));
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="px-6 py-3 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-semibold transition"
                                        onClick={() => {
                                            const el = document.getElementById('tagInput');
                                            if (el && typeof el.value === 'string') {
                                                const val = el.value.trim();
                                                if (val && !productInfo.tags.includes(val)) {
                                                    setProductInfo(p=>({ ...p, tags: [...p.tags, val] }));
                                                    el.value = '';
                                                }
                                            }
                                        }}
                                    >Add</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Product Badges & Features */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border-l-4 border-rose-400">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-sm">4</span>
                            Features & options
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">Badges (optional)</label>
                                <div className="flex flex-wrap gap-3">
                                    {fashionBadges.map((badge) => (
                                        <button
                                            key={badge}
                                            type="button"
                                            onClick={() => {
                                                if (productInfo.badges.includes(badge)) {
                                                    setProductInfo(prev => ({ ...prev, badges: prev.badges.filter(b => b !== badge) }))
                                                } else {
                                                    setProductInfo(prev => ({ ...prev, badges: [...prev.badges, badge] }))
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                                productInfo.badges.includes(badge)
                                                    ? 'bg-rose-800 text-white shadow-lg'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                        >
                                            {productInfo.badges.includes(badge) ? '✓ ' : ''}{badge}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-rose-400 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.fastDelivery} onChange={(e)=> setProductInfo(p=>({...p, fastDelivery: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">Fast delivery</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-rose-400 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.allowReturn} onChange={(e)=> setProductInfo(p=>({...p, allowReturn: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">7-day return</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-rose-400 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.allowReplacement} onChange={(e)=> setProductInfo(p=>({...p, allowReplacement: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">7-day replacement</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-rose-400 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.enquiryOnly} onChange={(e)=> setProductInfo(p=>({...p, enquiryOnly: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">Enquiry only</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-rose-400 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.showBuyButton} onChange={(e)=> setProductInfo(p=>({...p, showBuyButton: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">Show buy button</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-rose-400 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.showEnquiryButton} onChange={(e)=> setProductInfo(p=>({...p, showEnquiryButton: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">Show enquiry button</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Fashion product details */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border-l-4 border-rose-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-sm">5</span>
                            Fashion details
                        </h2>
                        <p className="mb-6 text-sm text-slate-600">Fabric, fit, care and occasion — shown on the product page.</p>
                        <div className="mb-4 flex flex-wrap gap-2">
                            {[
                                { label: 'Fabric', value: 'Cotton' },
                                { label: 'Fit', value: 'Regular' },
                                { label: 'Sleeve', value: '3/4th' },
                                { label: 'Neck', value: 'Round neck' },
                                { label: 'Occasion', value: 'Casual' },
                                { label: 'Care', value: 'Machine wash' },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => setGeneralDetails((prev) => {
                                        if (prev.some((p) => p.label === preset.label)) return prev
                                        return [...prev, preset]
                                    })}
                                    className="rounded-full border border-rose-200 bg-rose-50/50 px-3 py-1 text-xs font-medium text-rose-900 hover:border-rose-400"
                                >
                                    + {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                            <section className="space-y-3 bg-slate-50 border border-rose-100 rounded-xl p-4 min-w-0 overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-rose-700">Fabric & fit</h3>
                                    <button type="button" className="px-3 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-md text-sm font-semibold transition" onClick={addDetailRow(setMetalDetails)}>+ Add</button>
                                </div>
                                <div className="space-y-2">
                                    {metalDetails.map((it, idx) => (
                                        <div key={idx} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center min-w-0">
                                            <input className="w-full min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="e.g. Fabric" value={it.label} onChange={(e)=>updateDetail(setMetalDetails)(idx,'label', e.target.value)} />
                                            <input className="w-full min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="e.g. Cotton silk" value={it.value} onChange={(e)=>updateDetail(setMetalDetails)(idx,'value', e.target.value)} />
                                            <button type="button" className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition" onClick={()=>removeDetailRow(setMetalDetails)(idx)}>✕</button>
                                        </div>
                                    ))}
                                    {metalDetails.length === 0 && (
                                        <p className="text-sm text-slate-500 italic">Add fabric, material, length, or embroidery details.</p>
                                    )}
                                </div>
                            </section>
                            <section className="space-y-3 bg-slate-50 border border-rose-100 rounded-xl p-4 min-w-0 overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-bold text-rose-700">Care & specs</h3>
                                    <button type="button" className="px-3 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-md text-sm font-semibold transition" onClick={addDetailRow(setGeneralDetails)}>+ Add</button>
                                </div>
                                <div className="space-y-2">
                                    {generalDetails.map((it, idx) => (
                                        <div key={idx} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center min-w-0">
                                            <input className="w-full min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="e.g. Occasion" value={it.label} onChange={(e)=>updateDetail(setGeneralDetails)(idx,'label', e.target.value)} />
                                            <input className="w-full min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="e.g. Festive / Office" value={it.value} onChange={(e)=>updateDetail(setGeneralDetails)(idx,'value', e.target.value)} />
                                            <button type="button" className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition" onClick={()=>removeDetailRow(setGeneralDetails)(idx)}>✕</button>
                                        </div>
                                    ))}
                                    {generalDetails.length === 0 && (
                                        <p className="text-sm text-slate-500 italic">Add care, occasion, package contents, or model size notes.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Section 6: Rich Description */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border-l-4 border-rose-700">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="bg-rose-800 text-white px-3 py-1 rounded-full text-sm">6</span>
                            Full product story
                        </h2>
                        <p className="mb-4 text-sm text-slate-600">
                            AI fills a detailed story with highlights and tables (specs + size guide). You can edit anything below.
                        </p>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Describe the look, fabric, fit &amp; care</label>
                        
                        {/* Toolbar */}
                        <div className="border-2 border-slate-200 rounded-t-lg bg-slate-50 p-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={`px-3 py-2 rounded font-bold transition ${editor?.isActive('bold') ? 'bg-rose-800 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Bold">B</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`px-3 py-2 rounded italic transition ${editor?.isActive('italic') ? 'bg-rose-800 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Italic">I</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`px-3 py-2 rounded line-through transition ${editor?.isActive('strike') ? 'bg-rose-800 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Strikethrough">S</button>
                            <div className="w-px bg-slate-300 self-center mx-1"></div>
                            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-3 py-2 rounded font-bold transition ${editor?.isActive('heading', { level: 1 }) ? 'bg-rose-800 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Heading 1">H1</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-3 py-2 rounded font-bold transition ${editor?.isActive('heading', { level: 2 }) ? 'bg-rose-800 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Heading 2">H2</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`px-3 py-2 rounded transition ${editor?.isActive('bulletList') ? 'bg-rose-800 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Bullet List">• List</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`px-3 py-2 rounded transition ${editor?.isActive('orderedList') ? 'bg-rose-800 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Ordered List">1. List</button>
                            <button
                                type="button"
                                onClick={() => editor?.chain().focus().insertTable({ rows: 4, cols: 3, withHeaderRow: true }).run()}
                                className={`px-3 py-2 rounded font-semibold transition ${editor?.isActive('table') ? 'bg-rose-800 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                                title="Insert table"
                            >
                                Table
                            </button>
                            <div className="w-px bg-slate-300 self-center mx-1"></div>
                            <label className="px-3 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold cursor-pointer transition flex items-center gap-1" title="Upload Image">
                                🖼️ Image
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return
                                        try {
                                            const formData = new FormData()
                                            formData.append('image', file)
                                            const token = await getToken()
                                            const { data } = await axios.post('/api/store/upload-image', formData, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            })
                                            editor?.chain().focus().setImage({ src: data.url }).run()
                                            toast.success('Image uploaded!')
                                        } catch (error) {
                                            toast.error('Failed to upload image')
                                        }
                                        e.target.value = ''
                                    }}
                                />
                            </label>
                            <label className="px-3 py-2 rounded bg-purple-500 hover:bg-purple-600 text-white font-semibold cursor-pointer transition flex items-center gap-1" title="Upload Video">
                                🎥 Video
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return
                                        if (file.size > 50 * 1024 * 1024) {
                                            toast.error('Video file too large (max 50MB)')
                                            return
                                        }
                                        try {
                                            toast.loading('Uploading video...')
                                            const formData = new FormData()
                                            formData.append('image', file)
                                            const token = await getToken()
                                            const { data } = await axios.post('/api/store/upload-image', formData, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            })
                                            editor?.chain().focus().setVideo({ src: data.url }).run()
                                            toast.dismiss()
                                            toast.success('Video uploaded!')
                                        } catch (error) {
                                            toast.dismiss()
                                            toast.error('Failed to upload video')
                                        }
                                        e.target.value = ''
                                    }}
                                />
                            </label>
                            <input type="color" onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()} className="w-10 h-10 rounded cursor-pointer" title="Text Color" />
                        </div>
                        
                        {/* Editor */}
                        <EditorContent 
                            editor={editor} 
                            className="border-2 border-t-0 border-slate-200 rounded-b-lg bg-white p-6 min-h-[320px] max-h-[700px] overflow-y-auto prose prose-slate max-w-none focus-within:ring-2 focus-within:ring-rose-500 transition-all [&_video]:max-w-full [&_video]:rounded [&_video]:my-4 [&_img]:max-w-full [&_img]:rounded [&_img]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-rose-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-slate-300 [&_td]:px-3 [&_td]:py-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2"
                        />
                    </div>

                    {/* Section 7: Product Images */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border-l-4 border-rose-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-sm">7</span>
                            Product images
                        </h2>
                        <p className="mb-6 text-sm text-slate-600">Upload clear front, back, detail and model shots (up to 8).</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.keys(images).map((key) => {
                                const img = images[key]
                                const hasImage = img && (img.preview || typeof img === 'string')
                                return (
                                    <div key={key} className="relative border-4 border-dashed border-slate-300 hover:border-cyan-500 rounded-lg flex items-center justify-center h-40 cursor-pointer bg-slate-50 hover:bg-slate-100 overflow-hidden group transition">
                                        <label className="absolute inset-0 w-full h-full cursor-pointer">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e)=> e.target.files && handleImageUpload(key, e.target.files[0])} />
                                            {hasImage ? (
                                                <>
                                                    <Image 
                                                        src={img.preview || img} 
                                                        alt={`Product ${key}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white font-semibold">Change Image</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center">
                                                    <span className="text-2xl">📷</span>
                                                    <p className="text-slate-600 text-sm font-medium mt-1">Image {key}</p>
                                                </div>
                                            )}
                                        </label>
                                        {hasImage && (
                                            <button
                                                type="button"
                                                onClick={() => handleImageDelete(key)}
                                                className="absolute top-2 right-2 z-10 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
                                                title="Delete image"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={isModal ? "flex gap-3 pt-6 border-t border-slate-200" : "flex gap-4 sticky bottom-0 bg-gradient-to-t from-white to-white/80 pt-6 -mx-8 px-8 py-6"}>
                        <button disabled={loading} className={isModal ? "flex-1 px-6 py-3 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-semibold transition" : "flex-1 px-8 py-4 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-bold text-lg transition shadow-lg"}>
                            {loading ? 'Saving…' : (product ? 'Update fashion product' : 'Add to Nilaas store')}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => onClose ? onClose() : router.back()} 
                            className={isModal ? "px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition" : "px-8 py-4 bg-slate-300 hover:bg-slate-400 text-slate-900 rounded-lg font-bold transition"}
                        >
                            ✕ Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )

    if (isModal && typeof document !== 'undefined') {
        return createPortal(content, document.body)
    }

    return content
}
