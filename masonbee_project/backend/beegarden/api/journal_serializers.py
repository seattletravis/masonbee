from rest_framework import serializers
from beegarden.models import JournalEntry

class JournalEntrySerializer(serializers.ModelSerializer):
    garden_name = serializers.CharField(source='garden.name', read_only=True)

    class Meta:
        model = JournalEntry
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")
