import {SignIn} from '@clerk/nextjs';
import Link from 'next/link';
export default function SignInPage(){return <main id="main" className="auth-page">{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?<SignIn/>:<><h1>Identity setup required</h1><p>Configure the selected identity provider before opening a production workspace.</p><Link href="/app">Return to workspace</Link></>}</main>;}
