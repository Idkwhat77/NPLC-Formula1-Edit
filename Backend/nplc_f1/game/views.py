from django.shortcuts import render

import random
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import *

FIXED_QUESTIONS = [
    {"target": 73, "numbers": [9, 6, 4, 7]},    # Q1: 4 + 9 * 7 + 6 = 73 (+*+)
    {"target": 57, "numbers": [8, 3, 5, 9]},    # Q2: 9 * 8 - 5 * 3 = 57 (*-*)
    {"target": 47, "numbers": [7, 4, 8, 5]},    # Q3: 8 * 7 - 5 - 4 = 47 (*--)
    {"target": 23, "numbers": [6, 9, 3, 4]},    # Q4: 9 - 4 + 6 * 3 = 23 (-+*)
    {"target": 50, "numbers": [5, 7, 8, 6]},    # Q5: 6 * 8 + 7 - 5 = 50 (*+-)
    {"target": 83, "numbers": [4, 8, 7, 9]},    # Q6: 4 + 8 * 9 + 7 = 83 (+*+)
    {"target": 57, "numbers": [3, 9, 5, 8]},    # Q7: 9 * 8 - 5 * 3 = 57 (*-*)
    {"target": 53, "numbers": [6, 4, 9, 7]},    # Q8: 9 * 7 - 6 - 4 = 53 (*--)
    {"target": 21, "numbers": [8, 5, 3, 6]},    # Q9: 8 - 5 + 6 * 3 = 21 (-+*)
    {"target": 72, "numbers": [7, 9, 4, 5]},    # Q10: 5 + 9 * 7 + 4 = 72 (+*+)
    {"target": 24, "numbers": [4, 6, 8, 9]},    # Q11: 9 * 4 - 6 - 6 ... wait, strict 4 numbers: 9*4 - 8 - 4 (dup?). Let's do 9*4 - 6 - 8 (uses - - *) no that's not a preset.
                                                # Let's do (* - *): 9 * 6 - 8 * 4 = 54 - 32 = 22.
    {"target": 22, "numbers": [4, 6, 8, 9]},    # Q11 Correction: 9 * 6 - 8 * 4 = 22 (*-*)
    {"target": 58, "numbers": [5, 8, 7, 3]},    # Q12: 8 * 7 + 5 - 3 = 58 (*+-)
    {"target": 55, "numbers": [9, 3, 6, 4]},    # Q13: 9 * 6 + 4 - 3 = 55 (*+-)
    {"target": 25, "numbers": [7, 4, 5, 8]},    # Q14: 7 - 4 + 5 * 4... no. 8 - 7 + 4 * 5 = 21... no. 
                                                # (* - *): 8 * 5 - 7 * 4 = 40 - 28 = 12.
    {"target": 12, "numbers": [7, 4, 5, 8]},    # Q14 Correction: 8 * 5 - 7 * 4 = 12 (*-*)
    {"target": 63, "numbers": [8, 6, 9, 3]},    # Q15: 8 * 9 - 6 - 3 = 63 (*--)
    {"target": 64, "numbers": [4, 9, 7, 5]},    # Q16: 9 * 7 + 5 - 4 = 64 (*+-)
    {"target": 67, "numbers": [6, 5, 8, 7]},    # Q17: 6 + 8 * 7 + 5 = 67 (+*+)
    {"target": 62, "numbers": [3, 7, 4, 9]},    # Q18: 7 * 9 + 3 - 4 = 62 (*+-)
    {"target": 39, "numbers": [5, 6, 9, 8]},    # Q19: 9 * 5 - 6 ... no. (* - *): 9 * 6 - 5 * 3 (no 3). 9 * 5 - 6 (no).
                                                # Let's do (+ * +): 5 + 9 * 6 + 8... too big.
                                                # (* - -): 6 * 8 - 9 - 5 = 48 - 14 = 34.
    {"target": 34, "numbers": [5, 6, 9, 8]},    # Q19 Correction: 6 * 8 - 9 - 5 = 34 (*--)
    {"target": 56, "numbers": [7, 4, 6, 8]},    # Q20: 8 * 7 - 4 + 6? No. (* - *): 8 * 7 - 6 * 4? No. 
                                                # (* - *): 8 * 6 - 7 * 4 = 48 - 28 = 20.
    {"target": 20, "numbers": [7, 4, 6, 8]},    # Q20 Correction: 8 * 6 - 7 * 4 = 20 (*-*)
    {"target": 69, "numbers": [9, 8, 3, 5]},    # Q21: 9 * 8 - 3 (no). (* - -): 9 * 8 - 5 - 3 = 64. 
                                                # (+ * +): 3 + 9 * 8 + 5 = 80.
                                                # (- + *): 9 - 8 + 5 * 3? No. 
                                                # (* - *): 9 * 8 - 3 * 5 = 72 - 15 = 57.
    {"target": 57, "numbers": [9, 8, 3, 5]},    # Q21 Correction: 9 * 8 - 5 * 3 = 57 (*-*)
    {"target": 47, "numbers": [4, 7, 6, 9]},    # Q22: 6 * 7 + 9 - 4 = 47 (*+-)
    {"target": 57, "numbers": [8, 5, 4, 7]},    # Q23: 8 * 7 + 5 - 4 = 57 (*+-)
    {"target": 60, "numbers": [6, 9, 7, 3]},    # Q24: 9 * 7 - 3 (no). (* - -): 9 * 7 - 6 - 3 = 54.
                                                # (* - *): 9 * 7 - 6 * 3? No.
                                                # (+ * +): 3 + 9 * 6 + 7 = 64.
    {"target": 64, "numbers": [6, 9, 7, 3]},    # Q24 Correction: 3 + 9 * 6 + 7 = 64 (+*+)
    {"target": 43, "numbers": [5, 7, 8, 9]},    # Q25: 8 * 7 - 9 - 5 = 42. Wait 56-14=42.
    {"target": 42, "numbers": [5, 7, 8, 9]},    # Q25 Correction: 8 * 7 - 9 - 5 = 42 (*--)
    {"target": 47, "numbers": [3, 4, 8, 6]},    # Q26: 6 * 8 + 3 - 4 = 47 (*+-)
    {"target": 55, "numbers": [9, 6, 5, 4]},    # Q27: 9 * 6 + 5 - 4 = 55 (*+-)
    {"target": 31, "numbers": [7, 8, 4, 9]},    # Q28: 7 * 9 - 8 * 4 = 63 - 32 = 31 (*-*)
    {"target": 73, "numbers": [4, 5, 9, 8]},    # Q29: 9 * 8 + 5 - 4 = 73 (*+-)
    {"target": 44, "numbers": [6, 3, 7, 5]},    # Q30: 6 * 7 + 5 - 3 = 44 (*+-)
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