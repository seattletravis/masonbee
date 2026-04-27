from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from django.utils.http import urlsafe_base64_decode

from django.shortcuts import redirect

class RegisterView(APIView):
    authentication_classes = []  # Allow anyone
    permission_classes = []      # No auth required

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email")

        # Require all fields
        if not username or not password or not email:
            return Response(
                {"detail": "Username, email, and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check username uniqueness
        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "Username already taken"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check email uniqueness
        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "Email already in use"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create inactive user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            is_active=False
        )

        # Generate verification token + uid
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        verification_link = f"https://yourdomain.com/api/verify-email/{uid}/{token}/"

        # Send verification email
        send_mail(
            subject="Verify your MasonBee account",
            message=f"Click the link to verify your account: {verification_link}",
            from_email="no-reply@masonbee.com",
            recipient_list=[email],
            fail_silently=False,
        )

        return Response(
            {
                "detail": "Account created. Please check your email to verify your account."
            },
            status=status.HTTP_201_CREATED
        )



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