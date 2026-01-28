from django.shortcuts import render

import random
import json
import itertools
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import *

MIN_NUMBER = 3
MAX_NUMBER = 9
TOTAL_NUMBERS = 4
TARGET = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120]

# Available operation combinations from frontend
OPERATIONS = [
    ['*', '*', '+'],
    ['+', '*', '+'],
    ['+', '+', '*'],
    ['*', '+', '-'],
    ['*', '-', '*'],
    ['*', '+', '*'],
    ['*', '-', '-'],
    ['-', '+', '*'],
    ['+', '-', '+'],
    ['-', '*', '-'],
]

def calculate_expression(nums, ops):
    try:
        formula = f"{nums[0]} {ops[0]} {nums[1]} {ops[1]} {nums[2]} {ops[2]} {nums[3]}"
        return eval(formula)
    except:
        return None

def generate_solvable_puzzle():
    max_attempts = 100
    
    for attempt in range(max_attempts):
        # Pick a random target from the predefined list
        target = random.choice(TARGET)
        
        # Generate 4 random numbers in the original range
        numbers = random.sample(range(MIN_NUMBER, MAX_NUMBER + 1), TOTAL_NUMBERS)
        
        # Check if this target is achievable with these numbers
        for perm_nums in itertools.permutations(numbers):
            for ops in OPERATIONS:
                result = calculate_expression(perm_nums, ops)
                if result == target:
                    # Found a solution! Shuffle the numbers for variety
                    shuffled_numbers = numbers.copy()
                    random.shuffle(shuffled_numbers)
                    
                    print(f"Generated puzzle: Target={target}, Numbers={shuffled_numbers}")
                    print(f"One solution: {list(perm_nums)} with ops {ops} = {result}")
                    
                    return {
                        "target": target,
                        "numbers": shuffled_numbers
                    }
    
    # Fallback: generate a known solvable puzzle
    # 3 * 3 * 3 + 3 = 30
    return {
        "target": 30,
        "numbers": [3, 3, 3, 3]
    }

@csrf_exempt
def start_game(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'GET only'}, status=405)
    
    puzzle = generate_solvable_puzzle()
    
    return JsonResponse({
        "target": puzzle["target"],
        "numbers": puzzle["numbers"]
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
    
    # Menghapus SEMUA data di tabel score
    score.objects.all().delete()
    
    return JsonResponse({'message': 'Leaderboard reset success'}, status=200)