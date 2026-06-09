from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("drops", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="drop",
            name="access_password",
            field=models.CharField(blank=True, default="", max_length=256),
        ),
    ]
