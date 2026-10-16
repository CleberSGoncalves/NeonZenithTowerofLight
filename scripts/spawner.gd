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
	var roll := randf()
	if roll < 0.55:
		_spawn_data_orb()
	else:
		_spawn_laser_hazard()

func _spawn_data_orb() -> void:
	var orb := Area2D.new()
	orb.position = Vector2(randf_range(60, 1220), randf_range(60, 660))
	
	var col := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 14.0
	col.shape = shape
	orb.add_child(col)
	
	var rect := ColorRect.new()
	rect.size = Vector2(18, 18)
	rect.position = Vector2(-9, -9)
	rect.color = Color(0.0, 0.96, 1.0, 0.95)
	orb.add_child(rect)
	
	orb.body_entered.connect(func(body: Node2D):
		if body.is_in_group("player"):
			if GameManager:
				GameManager.add_score(100)
			if EventBus:
				EventBus.play_sfx.emit("collect_orb")
			orb.queue_free()
	)
	get_parent().add_child(orb)

func _spawn_laser_hazard() -> void:
	var hazard := Area2D.new()
	var start_x := randf_range(100, 1180)
	hazard.position = Vector2(start_x, -40)
	
	var col := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(30, 60)
	col.shape = shape
	hazard.add_child(col)
	
	var rect := ColorRect.new()
	rect.size = Vector2(24, 50)
	rect.position = Vector2(-12, -25)
	rect.color = Color(0.95, 0.2, 0.35, 0.9)
	hazard.add_child(rect)
	
	hazard.body_entered.connect(func(body: Node2D):
		if body.is_in_group("player"):
			var player_node = body
			if player_node.get("is_dashing") == true:
				return # Esquiva com Dash!
			if GameManager:
				GameManager.take_damage(20)
			if EventBus:
				EventBus.play_sfx.emit("hit")
				EventBus.screen_shake_requested.emit(0.35)
			hazard.queue_free()
	)
	
	# Movimento vertical do perigo
	var tween := hazard.create_tween()
	tween.tween_property(hazard, "position:y", 760.0, 3.2 / current_rate_multiplier)
	tween.tween_callback(hazard.queue_free)
	
	get_parent().add_child(hazard)

