extends Node

## HealthComponent — Gerencia HP, dano e cura (Godot 4.7.2)
## Componente puro: sem lógica de movimento ou renderização.
## Máx. de responsabilidade: SOMENTE pontos de vida.

signal died()
signal damaged(amount: int, remaining: int)
signal healed(amount: int, current: int)

@export var max_health: int = 100
var current_health: int = 100
var is_dead: bool = false

func _ready() -> void:
	current_health = max_health

func take_damage(amount: int) -> void:
	if is_dead:
		return
	current_health = max(0, current_health - amount)
	damaged.emit(amount, current_health)
	EventBus.health_updated.emit(current_health, max_health)
	if current_health <= 0:
		is_dead = true
		died.emit()
		EventBus.player_died.emit()

func heal(amount: int) -> void:
	if is_dead:
		return
	current_health = min(max_health, current_health + amount)
	healed.emit(amount, current_health)
	EventBus.health_updated.emit(current_health, max_health)

func reset() -> void:
	current_health = max_health
	is_dead = false
	EventBus.health_updated.emit(current_health, max_health)
