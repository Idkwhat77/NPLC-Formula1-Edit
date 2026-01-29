from django.shortcuts import render

import random
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import *

# 50 FIXED QUESTIONS IN ORDER 1-50
FIXED_QUESTIONS = [
    {"target": 156, "numbers": [9, 6, 4, 7]},   # Q1
    {"target": 42, "numbers": [8, 3, 5, 9]},    # Q2
    {"target": 187, "numbers": [7, 4, 8, 5]},   # Q3
    {"target": 73, "numbers": [6, 9, 3, 4]},    # Q4
    {"target": 28, "numbers": [5, 7, 8, 6]},    # Q5
    {"target": 165, "numbers": [4, 8, 7, 9]},   # Q6
    {"target": 91, "numbers": [3, 9, 5, 8]},    # Q7
    {"target": 134, "numbers": [6, 4, 9, 7]},   # Q8
    {"target": 55, "numbers": [8, 5, 3, 6]},    # Q9
    {"target": 198, "numbers": [7, 9, 4, 5]},   # Q10
    {"target": 39, "numbers": [4, 6, 8, 9]},    # Q11
    {"target": 112, "numbers": [5, 8, 7, 3]},   # Q12
    {"target": 67, "numbers": [9, 3, 6, 4]},    # Q13
    {"target": 21, "numbers": [7, 4, 5, 8]},    # Q14
    {"target": 176, "numbers": [8, 6, 9, 3]},   # Q15
    {"target": 85, "numbers": [4, 9, 7, 5]},    # Q16
    {"target": 143, "numbers": [6, 5, 8, 7]},   # Q17
    {"target": 62, "numbers": [3, 7, 4, 9]},    # Q18
    {"target": 29, "numbers": [5, 6, 9, 8]},    # Q19
    {"target": 159, "numbers": [7, 4, 6, 8]},   # Q20
    {"target": 96, "numbers": [9, 8, 3, 5]},    # Q21
    {"target": 47, "numbers": [4, 7, 6, 9]},    # Q22
    {"target": 128, "numbers": [8, 5, 4, 7]},   # Q23
    {"target": 74, "numbers": [6, 9, 7, 3]},    # Q24
    {"target": 183, "numbers": [5, 7, 8, 9]},   # Q25
    {"target": 38, "numbers": [3, 4, 8, 6]},    # Q26
    {"target": 117, "numbers": [9, 6, 5, 4]},   # Q27
    {"target": 81, "numbers": [7, 8, 4, 9]},    # Q28
    {"target": 154, "numbers": [4, 5, 9, 8]},   # Q29
    {"target": 65, "numbers": [6, 3, 7, 5]},    # Q30
    {"target": 191, "numbers": [8, 9, 6, 7]},   # Q31
    {"target": 53, "numbers": [4, 6, 9, 5]},    # Q32
    {"target": 125, "numbers": [7, 5, 8, 3]},   # Q33
    {"target": 89, "numbers": [9, 4, 6, 7]},    # Q34
    {"target": 44, "numbers": [5, 8, 3, 7]},    # Q35
    {"target": 167, "numbers": [6, 7, 9, 4]},   # Q36
    {"target": 78, "numbers": [8, 3, 5, 9]},    # Q37
    {"target": 136, "numbers": [4, 9, 7, 6]},   # Q38
    {"target": 59, "numbers": [7, 6, 4, 8]},    # Q39
    {"target": 32, "numbers": [3, 5, 9, 7]},    # Q40
    {"target": 149, "numbers": [8, 4, 6, 9]},   # Q41
    {"target": 87, "numbers": [5, 9, 7, 8]},    # Q42
    {"target": 172, "numbers": [6, 8, 4, 7]},   # Q43
    {"target": 61, "numbers": [9, 3, 5, 6]},    # Q44
    {"target": 26, "numbers": [4, 7, 8, 5]},    # Q45
    {"target": 138, "numbers": [7, 6, 9, 8]},   # Q46
    {"target": 94, "numbers": [8, 5, 4, 6]},    # Q47
    {"target": 71, "numbers": [3, 9, 6, 7]},    # Q48
    {"target": 163, "numbers": [5, 7, 4, 9]},   # Q49
    {"target": 46, "numbers": [6, 4, 8, 3]},    # Q50
]

@csrf_exempt
def start_game(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'GET only'}, status=405)
    
    # Get question number from frontend, or pick random starting point (1-42)
    question_num = int(request.GET.get('q', random.randint(1, 42))) - 1  # Convert to 0-based index
    
    # Make sure it's within bounds
    question_num = question_num % len(FIXED_QUESTIONS)
    
    # Get the specific question
    question = FIXED_QUESTIONS[question_num]
    
    # Shuffle the numbers for display
    shuffled_numbers = question["numbers"].copy()
    random.shuffle(shuffled_numbers)
    
    print(f"Question {question_num + 1}: Target={question['target']}, Numbers={shuffled_numbers}")
    
    return JsonResponse({
        "target": question["target"],
        "numbers": shuffled_numbers
    })

@csrf_exempt
def submit_result(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    data = json.loads(request.body)
    score.objects.create(
        team_name=data.get('team_name'),
        score=data.get('score')
    )
    return JsonResponse({'message': 'Success'}, status=200)

@csrf_exempt
def get_leaderboard(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'GET only'}, status=405)
    top_10_score = score.objects.all().order_by('-score')[:10].values('team_name', 'score', 'created_at')
    return JsonResponse(list(top_10_score), safe=False, status=200)

@csrf_exempt
def reset_leaderboard(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)
    
    # Delete all scores
    score.objects.all().delete()
    
    return JsonResponse({'message': 'Leaderboard reset success'}, status=200)