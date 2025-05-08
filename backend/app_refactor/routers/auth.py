
from fastapi.responses import JSONResponse
from ..schemas import UserSignup, UserLogin, RefreshRequest, RefreshResponse
from ..db import supabase
from ..dependencies import get_current_user
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
router = APIRouter()

@router.post("/signup")
async def signup(user: UserSignup):
    try:
        # First, check if the user already exists
        print(f"Attempting to sign up user with email: {user.email}")
        
        # Sign up the user with Supabase
        response = supabase.auth.sign_up({"email": user.email, "password": user.password})
        
        # Log the response
        print("Supabase Signup Response:", response)

        if response.user is None:
            print("Signup failed: User is None")
            raise HTTPException(status_code=400, detail="Signup failed. Check email/password validity.")

        try:
            # Try to save user email to database
            print(f"Attempting to save user to database with ID: {response.user.id}")
            supabase.table("users").insert({
                "id": response.user.id,  # Use the Supabase user ID as the primary key
                "email": user.email,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            print("Successfully saved user to database")
        except Exception as db_error:
            # If database save fails, continue with auth flow but log the error
            print(f"Warning: Failed to save user to database: {str(db_error)}")
            # This shouldn't stop the signup process

        try:
            # Try to sign in the user immediately after signup
            print("Attempting to sign in the user after signup")
            signin_response = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
            print("Signin response after signup:", signin_response)
            
            if signin_response.user is None:
                print("Warning: Auto-login failed after signup")
                # If sign-in fails after signup, still return success but without tokens
                return {
                    "message": "User signed up successfully but auto-login failed. Please log in manually.",
                    "user_id": response.user.id,
                    "email": response.user.email
                }

            # Return both user info and tokens
            print("Successfully signed up and logged in user")
            return {
                "message": "User signed up successfully!",
                "user_id": response.user.id,
                "email": response.user.email,
                "access_token": signin_response.session.access_token,
                "refresh_token": signin_response.session.refresh_token
            }
        except Exception as signin_error:
            # If auto-login fails, still consider signup successful
            print(f"Auto-login failed after signup: {str(signin_error)}")
            return {
                "message": "User signed up successfully but auto-login failed. Please log in manually.",
                "user_id": response.user.id,
                "email": response.user.email
            }
    except Exception as e:
        print("Error during signup:", str(e))
        print("Error details:", e)
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@router.post("/login")
async def login(user: UserLogin):
    response = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
    
    if response.user is None:
        raise HTTPException(status_code=400, detail=response.error.message)

    return {"access_token": response.session.access_token, "refresh_token": response.session.refresh_token}

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(req: RefreshRequest):
    # Call supabase to rotate the session
    result = supabase.auth.refresh_session(req.refresh_token)

    # supabase-py returns a dict with 'data' and 'error'
    err = result.get("error")
    if err:
        # Something went wrong on the Supabase side
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Refresh failed: {err}"
        )

    data = result.get("data") or {}
    session = data.get("session")
    if not session:
        # No session in the payload means refresh failed
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token or session expired."
        )

    # Optionally, set the new refresh token in an HttpOnly cookie:
    resp = JSONResponse(content={
        "access_token": session["access_token"],
        "refresh_token": session["refresh_token"],
    })
    resp.set_cookie(
        key="refresh_token",
        value=session["refresh_token"],
        httponly=True,
        secure=True,       # False on localhost/http
        samesite="strict"  # or "lax"
    )
    return resp

@router.get("/protected")
async def protected_route(user=Depends(get_current_user)):
    return {"message": "You have accessed a protected route!", "user": user}
