import { clientConfigPick } from '@tekup/config';
// Pick only safe client-exposed keys. NEXT_PUBLIC_ vars can be derived from these at build time.
const publicConfig = clientConfigPick(['FLOW_API_URL']);
/** @type {import('next').NextConfig} */
const nextConfig = { 
	reactStrictMode: true, 
	output: 'standalone',
	env: {
		NEXT_PUBLIC_API_URL: publicConfig.FLOW_API_URL
	}
};
export default nextConfig;
