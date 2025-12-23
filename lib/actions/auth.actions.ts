"use server"


import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({
                                          email,
                                          password,
                                          fullName,
                                          country,
                                          investmentGoals,
                                          riskTolerance,
                                          preferredIndustry
                                      }: SignUpFormData) => {
    let signupResponse;
    
    try {
        signupResponse = await auth.api.signUpEmail({body: {email, password, name: fullName}})
        
        // Log the response for debugging
        console.log('SignUp API Response:', JSON.stringify(signupResponse, null, 2))

        // Check if response indicates success (better-auth might return error in response object)
        if (!signupResponse || (signupResponse as any)?.error) {
            const errorMsg = (signupResponse as any)?.error?.message || 'Failed to create account'
            console.error('SignUp API Error:', errorMsg, signupResponse)
            
            // Even if response has error, check if user was actually created and logged in
            // (since autoSignIn: true might have logged them in despite error response)
            try {
                const session = await auth.api.getSession({headers: await headers()})
                if (session?.user && session.user.email === email) {
                    // User is logged in, so signup actually succeeded
                    console.log('User session found after signup - treating as success')
                    
                    // Send inngest event
                    try {
                        inngest.send({
                            name: 'app/user.created',
                            data: {email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry}
                        }).catch(err => {
                            console.warn('Inngest event failed (non-blocking):', err)
                        })
                    } catch (inngestError) {
                        console.warn('Inngest send error (non-blocking):', inngestError)
                    }
                    
                    return {success: true, data: signupResponse}
                }
            } catch (sessionError) {
                console.warn('Could not verify session:', sessionError)
            }
            
            if (errorMsg.toLowerCase().includes('already exists') || errorMsg.toLowerCase().includes('duplicate')) {
                return {success: false, error: 'Email already registered'}
            }
            if (errorMsg.toLowerCase().includes('password')) {
                return {success: false, error: 'Password does not meet requirements'}
            }
            
            return {success: false, error: errorMsg || 'Failed to create account. Please try again.'}
        }

        // If we get here, signup was successful
        // Send inngest event asynchronously in a separate try-catch so it doesn't affect signup flow
        try {
            inngest.send({
                name: 'app/user.created',
                data: {email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry}
            }).catch(err => {
                console.warn('Inngest event failed (non-blocking):', err)
            })
        } catch (inngestError) {
            // Inngest error should not affect signup success
            console.warn('Inngest send error (non-blocking):', inngestError)
        }

        return {success: true, data: signupResponse}
    } catch (e) {
        // Provide more specific error messages based on what went wrong
        const errorMsg = e instanceof Error ? e.message : 'Failed to create account'
        console.error('SignUp Exception:', errorMsg, e)
        
        // Even if an exception occurred, check if user was actually created and logged in
        // (since autoSignIn: true might have logged them in before the exception)
        try {
            const session = await auth.api.getSession({headers: await headers()})
            if (session?.user && session.user.email === email) {
                // User is logged in, so signup actually succeeded despite the exception
                console.log('User session found after exception - treating as success')
                
                // Send inngest event
                try {
                    inngest.send({
                        name: 'app/user.created',
                        data: {email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry}
                    }).catch(err => {
                        console.warn('Inngest event failed (non-blocking):', err)
                    })
                } catch (inngestError) {
                    console.warn('Inngest send error (non-blocking):', inngestError)
                }
                
                return {success: true, data: signupResponse}
            }
        } catch (sessionError) {
            console.warn('Could not verify session after exception:', sessionError)
        }
        
        // Common errors
        if (errorMsg.toLowerCase().includes('already exists') || errorMsg.toLowerCase().includes('duplicate')) {
            return {success: false, error: 'Email already registered'}
        }
        if (errorMsg.toLowerCase().includes('password')) {
            return {success: false, error: 'Password does not meet requirements'}
        }
        
        return {success: false, error: 'Failed to create account. Please try again.'}
    }
}

export const signInWithEmail = async ({email, password,}: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({body: {email, password,}})
        return {success: true, data: response}
    } catch (e) {
        console.log('Sign in failed', e)
        // Return a clear, user-facing message so the frontend can show it inline
        return {success: false, error: 'Invalid email or password'}
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({headers: await headers()})
    } catch (err) {
        console.log('Sign out failed', err);
        return {success: false, error: 'Sign out failed'}
    }
}