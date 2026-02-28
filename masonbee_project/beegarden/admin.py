from django.contrib import admin
from .models import Garden, BeeHouse, GardenChatMessage, DirectMessage, DirectMessageThread, DirectMessageThreadParticipant, BeeHouseEvent

admin.site.register(Garden)
admin.site.register(BeeHouse)
admin.site.register(BeeHouseEvent)
admin.site.register(GardenChatMessage)
admin.site.register(DirectMessage)
admin.site.register(DirectMessageThread)
admin.site.register(DirectMessageThreadParticipant)





# Register your models here.
