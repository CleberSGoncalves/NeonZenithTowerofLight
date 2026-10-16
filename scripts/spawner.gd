extends Node2D

## Spawner com Dificuldade Adaptativa e Invasão Boss Rush (Godot 4.7.2)

@export var base_spawn_interval: float = 3.5
@export var boss_scene: PackedScene = preload("res://scenes/boss.tscn")

var spawn_timer: float = 0.0
var current_rate_multiplier: float = 1.0
var is_player_critical: bool = false

func _ready() -> void:
	if GameManager:
		GameManager.adaptive_pacing_changed.connect(_on_adaptive_pacing_changed)
		GameManager.boss_wave_triggered.connect(_on_boss_wave_triggered)
		GameManager.emergency_heal_spawned.connect(_on_emergency_heal_spawned)

func _process(delta: float) -> void:
	if not GameManager or not GameManager.is_game_active:
		return
	
	# Intervalo ajustado pela Dificuldade Adaptativa (+15% velocidade com 100% vida)
	var interval: float = base_spawn_interval / current_rate_multiplier
	spawn_timer += delta
	
	if spawn_timer >= interval:
		spawn_timer = 0.0
		_spawn_dynamic_hazard()

func _on_adaptive_pacing_changed(rate_multiplier: float, is_critical: bool) -> void:
	current_rate_multiplier = rate_multiplier
	is_player_critical = is_critical

func _on_boss_wave_triggered(wave_index: int, multiplier: float) -> void:
	call_deferred("_spawn_boss", wave_index, multiplier)

func _spawn_boss(wave_index: int, multiplier: float) -> void:
	if not boss_scene:
		return
	var boss = boss_scene.instantiate()
	boss.position = Vector2(randf_range(300, 980), 120)
	if boss.has_method("configure_boss"):
		boss.configure_boss(wave_index, multiplier)
	get_parent().add_child(boss)

func _on_emergency_heal_spawned(pos: Vector2) -> void:
	call_deferred("_create_heal_orb", pos)

func _create_heal_orb(pos: Vector2) -> void:
	var orb := Area2D.new()
	orb.position = pos
	
	var col := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 16.0
	col.shape = shape
	orb.add_child(col)
	
	# Visual do Orbe de Cura Quântica
	var color_rect := ColorRect.new()
	color_rect.size = Vector2(24, 24)
	color_rect.position = Vector2(-12, -12)
	color_rect.color = Color(0.06, 0.9, 0.5, 0.9)
	orb.add_child(color_rect)
	
	orb.body_entered.connect(func(body: Node2D):
		if body.is_in_group("player"):
			if GameManager:
				GameManager.heal(30)
				GameManager.add_score(50)
			if EventBus:
				EventBus.play_sfx.emit("collect_heal")
			orb.queue_free()
	)
	
	get_parent().add_child(orb)

func _spawn_dynamic_hazard() -> void:
	# Spawn procedural leve de obstáculos na área
	pass
