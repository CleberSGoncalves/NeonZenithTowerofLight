extends CharacterBody2D

## Chefão do Modo Boss Rush com Ataque em Espiral (Godot 4.7.2)

@export var max_health: int = 500
var current_health: int = 500
var wave_index: int = 1
var score_mult: float = 1.0

var spiral_angle: float = 0.0
var attack_timer: float = 0.0
var move_dir: float = 1.0
var move_speed: float = 90.0

@onready var health_bar: ProgressBar = $BossHealthBar
@onready var sprite_core: ColorRect = $CoreSprite

func _ready() -> void:
	add_to_group("boss")
	current_health = max_health
	if health_bar:
		health_bar.max_value = max_health
		health_bar.value = current_health

func configure_boss(wave: int, multiplier: float) -> void:
	wave_index = wave
	score_mult = multiplier
	max_health = 400 + (wave * 150)
	current_health = max_health
	if health_bar:
		health_bar.max_value = max_health
		health_bar.value = current_health

func _physics_process(delta: float) -> void:
	# Movimento pendular suave no topo da tela
	position.x += move_dir * move_speed * delta
	if position.x > 1050:
		move_dir = -1.0
	elif position.x < 230:
		move_dir = 1.0
	
	# Padrão de ataque em espiral contínua
	attack_timer += delta
	spiral_angle += 120.0 * delta
	if spiral_angle > 360.0:
		spiral_angle -= 360.0
	
	if attack_timer >= 0.25:
		attack_timer = 0.0
		_fire_spiral_bullet(spiral_angle)
		_fire_spiral_bullet(spiral_angle + 180.0)

func _fire_spiral_bullet(angle_deg: float) -> void:
	var bullet := Area2D.new()
	bullet.position = global_position
	
	var col := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 8.0
	col.shape = shape
	bullet.add_child(col)
	
	var rect := ColorRect.new()
	rect.size = Vector2(12, 12)
	rect.position = Vector2(-6, -6)
	rect.color = Color(1.0, 0.2, 0.4, 0.95) # Neon Magenta
	bullet.add_child(rect)
	
	var rad := deg_to_rad(angle_deg)
	var dir := Vector2(cos(rad), sin(rad)).normalized()
	
	bullet.set_script(preload("res://scripts/boss_projectile.gd") if ResourceLoader.exists("res://scripts/boss_projectile.gd") else null)
	bullet.set_meta("direction", dir)
	bullet.set_meta("speed", 220.0)
	
	bullet.body_entered.connect(func(body: Node2D):
		if body.is_in_group("player"):
			if GameManager:
				GameManager.take_damage(15)
			bullet.queue_free()
	)
	
	get_parent().add_child(bullet)

func take_damage(amount: int) -> void:
	current_health = max(0, current_health - amount)
	if health_bar:
		health_bar.value = current_health
	
	# Efeito de hit squash visual
	if sprite_core:
		sprite_core.color = Color(1.0, 1.0, 1.0, 1.0)
		var t = get_tree().create_timer(0.06)
		t.timeout.connect(func(): if sprite_core: sprite_core.color = Color(0.92, 0.28, 0.6, 1.0))
	
	if current_health <= 0:
		_die()

func _die() -> void:
	if GameManager:
		var reward = int(1000 * score_mult)
		GameManager.add_score(reward)
		GameManager.heal(25)
	if EventBus:
		EventBus.hud_show_message.emit("💥 CHEFÃO DERROTADO! +%d PTS" % int(1000 * score_mult), 3.0)
		EventBus.play_sfx.emit("boss_defeat")
	queue_free()
