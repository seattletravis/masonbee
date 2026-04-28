print("REGISTER VIEW LOADED")

from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.shortcuts import redirect

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.permissions import IsAuthenticated

import os


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    authentication_classes = []  # Allow anyone
    permission_classes = []      # No auth required

    def post(self, request):
        print("\n================ REGISTER VIEW EXECUTED ================")
        print("RAW request.data:", request.data)

        # Extract fields
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email")

        print(f"Parsed fields -> username: {username}, email: {email}, password: {'***' if password else None}")

        # ---------------------------
        # VALIDATION: Missing fields
        # ---------------------------
        if not username or not password or not email:
            print("ERROR 1: Missing required fields")
            return Response(
                {"detail": "Username, email, and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------
        # VALIDATION: Username exists
        # ---------------------------
        if User.objects.filter(username=username).exists():
            print("ERROR 2: Username already taken")
            return Response(
                {"detail": "Username already taken"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------
        # VALIDATION: Email exists
        # ---------------------------
        if User.objects.filter(email=email).exists():
            print("ERROR 3: Email already in use")
            return Response(
                {"detail": "Email already in use"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ---------------------------
        # USER CREATION + TOKEN GEN
        # ---------------------------
        try:
            print("STEP A: Creating user...")
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                is_active=False
            )
            print("STEP A SUCCESS: User created with ID:", user.id)

            print("STEP B: Generating UID...")
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            print("STEP B SUCCESS: UID =", uid)

            print("STEP C: Generating token...")
            token = default_token_generator.make_token(user)
            print("STEP C SUCCESS: Token =", token)

            print("STEP D: Building verification link...")

            # Dev vs Prod URL
            if os.getenv("DEBUG", "False") == "True":
                base_url = "http://127.0.0.1:8000"
            else:
                base_url = "https://themasonbee.com"

            verification_link = f"{base_url}/api/verify-email/{uid}/{token}/"
            print("STEP D SUCCESS: Link =", verification_link)

        except Exception as e:
            print("REGISTER ERROR (inside try/except):", repr(e))
            return Response({"detail": str(e)}, status=400)

        # ---------------------------
        # SEND VERIFICATION EMAIL
        # ---------------------------
        print("STEP E: Sending verification email...")

        try:
            send_mail(
                subject="Verify your MasonBee account",
                message=f"Click the link to verify your account:\n\n{verification_link}",
                from_email="no-reply@themasonbee.com",
                recipient_list=[email],
                fail_silently=False,
            )
            print("STEP E SUCCESS: Email sent to", email)
        except Exception as e:
            print("EMAIL SEND ERROR:", repr(e))
            return Response(
                {"detail": "User created but email failed to send", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ---------------------------
        # SUCCESS RESPONSE
        # ---------------------------
        print("REGISTER SUCCESS: Returning 201 response")
        return Response(
            {"detail": "Account created. Check your email to verify."},
            status=status.HTTP_201_CREATED
        )




class CheckUsernameView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        username = request.query_params.get("username", "").strip()

        if not username:
            return Response({"available": False, "detail": "No username provided"}, 400)

        exists = User.objects.filter(username=username).exists()

        return Response({"available": not exists})


class CheckEmailView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        email = request.query_params.get("email", "").strip()

        if not email:
            return Response({"available": False, "detail": "No email provided"}, 400)

        exists = User.objects.filter(email=email).exists()

        return Response({"available": not exists})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
        })


class VerifyEmailView(APIView):
    authentication_classes = []  # Anyone can verify
    permission_classes = []

    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            # Invalid UID → redirect with status flag
            return redirect("/email-verified?status=invalid")

        # Validate token
        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return redirect("/email-verified")
        else:
            # Token exists but is invalid or expired
            return redirect("/email-verified?status=expired")