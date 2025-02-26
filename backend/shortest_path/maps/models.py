from django.db import models

# Create your models here.
class Node(models.Model):
    name = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()

class Edge(models.Model):
    start_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name="start_edges")
    end_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name="end_edges")
    distance = models.FloatField()