# Generated by Django 4.2 on 2025-03-19 23:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('maps', '0002_rename_distance_edge_weight'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='node',
            name='name',
        ),
    ]
