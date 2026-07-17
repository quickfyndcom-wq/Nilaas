/** @type {import('next').NextConfig} */
const domains = [
    'placehold.co',
    'rukminim2.flixcart.com',
    'lh3.googleusercontent.com',
    'ik.imagekit.io',
    'nilaas.s3.ap-south-1.amazonaws.com',
    'nilaas.s3.amazonaws.com',
];

try {
    const s3Bases = [
        process.env.AWS_S3_PUBLIC_URL,
        process.env.NEXT_PUBLIC_S3_BASE_URL,
    ].filter(Boolean);

    for (const base of s3Bases) {
        const u = new URL(base);
        if (!domains.includes(u.hostname)) domains.push(u.hostname);
    }

    if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
        const host = `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        if (!domains.includes(host)) domains.push(host);
        const hostAlt = `${process.env.AWS_S3_BUCKET}.s3.amazonaws.com`;
        if (!domains.includes(hostAlt)) domains.push(hostAlt);
    }
} catch {}

const nextConfig = {
    images: {
        unoptimized: false,
        domains,
        remotePatterns: domains.map((host) => ({
            protocol: 'https',
            hostname: host,
            pathname: '/**',
        })),
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
    },
    async headers() {
        return [
            {
                source: '/store/:path*',
                headers: [
                    {
                        key: 'X-Robots-Tag',
                        value: 'noindex',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
