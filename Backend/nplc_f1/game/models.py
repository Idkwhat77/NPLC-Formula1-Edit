from django.db import models

# Create your models here.

class score(models.Model):
    team_name = models.CharField(max_length=20)
    score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)


def __str__(self):
        # Kita format tampilan agar muncul Jam:Menit:Detik
        # %d-%m-%Y = Tanggal-Bulan-Tahun
        # %H:%M:%S = Jam:Menit:Detik
        waktu = self.created_at.strftime('%H:%M:%S')
        return f"{self.team_name} | Score: {self.score} | Pukul: {waktu}"