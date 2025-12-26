'use client';

import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {signInWithEmail} from "@/lib/actions/auth.actions";

import React, {useState} from 'react';

const SignIn = () => {
    const router = useRouter()
    const {
        register, handleSubmit, formState: {errors, isSubmitting},
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '', password: '',
        }, mode: 'onBlur',
    });
    const [authError, setAuthError] = useState<string | null>(null)

    const onSubmit = async (data: SignInFormData) => {
        setAuthError(null)
        try {
            const result = await signInWithEmail(data)
            if (result.success) return router.push("/")

            setAuthError(result.error || result.message || 'Invalid email or password')
        } catch (e) {
            console.error(e);
            const msg = e instanceof Error ? e.message : 'Failed to sign in.'
            toast.error('Sign in failed', { description: msg })
            setAuthError('Invalid email or password')
        }
    }

    return (<>
        <h1 className="form-title">Welcome back</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <InputField
                name="email"
                label="Email"
                placeholder="contact@signalist.com"
                register={register}
                error={errors.email}
                validation={{required: 'Email is required', pattern: /^\w+@\w+\.\w+$/}}
            />

            <InputField
                name="password"
                label="Password"
                placeholder="Enter your password"
                type="password"
                register={register}
                error={errors.password}
                validation={{required: 'Password is required', minLength: 8}}
            />

            {authError && (
                <p className="text-sm text-yellow-500">{authError}</p>
            )}

            <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                {isSubmitting ? 'Signing In' : 'Sign In'}
            </Button>

            <FooterLink text="Don't have an account?" linkText="Create an account" href="/sign-up"/>
        </form>
    </>);
};
export default SignIn;