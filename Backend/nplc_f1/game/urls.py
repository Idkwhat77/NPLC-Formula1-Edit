from django.urls import path
from .views import *

urlpatterns = [
    path('start/', start_game, name='start_game'),
    path('submit/', submit_result, name='submit_result'),
    path('leaderboard/', get_leaderboard, name='get_leaderboard'),
    path('reset/', reset_leaderboard, name='reset_leaderboard'),
]