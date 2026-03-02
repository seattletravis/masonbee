from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def api_login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return JsonResponse({"detail": "Logged in"})
        return JsonResponse({"detail": "Invalid credentials"}, status=400)

    return JsonResponse({"detail": "POST required"}, status=405)