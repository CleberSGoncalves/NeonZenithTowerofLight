extends CharacterBody2D

## Controlador de Jogador 2D (Godot 4.7.2 / GDScript 2.0)
## Movimentação fluida baseada em Delta Time, aceleração e amortecimento

@export var speed: float = 380.0
@export var acceleration: float = 2200.0
@export var friction: float = 1800.0
@export var dash_speed: float = 750.0

var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_cooldown: float = 0.0
var anim_time: float = 0.0

@onready var visual: ColorRect = $Visual
@onready var collision_shape: CollisionShape2D = $CollisionShape2D

func _ready() -> void:
	add_to_group("player")
	if GameManager and not GameManager.is_game_active:
		GameManager.start_new_game()

func _physics_process(delta: float) -> void:
	anim_time += delta
	
	if dash_cooldown > 0.0:
		dash_cooldown -= delta

	if is_dashing:
		dash_timer -= delta
		if dash_timer <= 0.0:
			is_dashing = false

	# Garante que o jogo não fique preso em estado inativo
	if GameManager and not GameManager.is_game_active:
		GameManager.is_game_active = true

	# Leitura Direta de Input: WASD + Setas + Ações Godot
	var input_x := 0.0
	var input_y := 0.0

	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT) or Input.is_action_pressed("ui_left"):
		input_x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT) or Input.is_action_pressed("ui_right"):
		input_x += 1.0
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP) or Input.is_action_pressed("ui_up"):
		input_y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN) or Input.is_action_pressed("ui_down"):
		input_y += 1.0

	var direction := Vector2(input_x, input_y).normalized()
	
	# Dash com Espaço ou Shift
	if (Input.is_key_pressed(KEY_SPACE) or Input.is_key_pressed(KEY_SHIFT)) and dash_cooldown <= 0.0 and direction != Vector2.ZERO:
		is_dashing = true
		dash_timer = 0.18
		dash_cooldown = 0.9
		velocity = direction * dash_speed
		if EventBus:
			EventBus.play_sfx.emit("dash")

	if not is_dashing:
		if direction != Vector2.ZERO:
			velocity = velocity.move_toward(direction * speed, acceleration * delta)
		else:
			velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

	move_and_slide()

	# Mantém o jogador dentro dos limites da tela (1280x720)
	position.x = clamp(position.x, 24.0, 1256.0)
	position.y = clamp(position.y, 24.0, 696.0)

	# Efeito visual de respiração/pulso neon suave
	if visual:
		var pulse := 1.0 + sin(anim_time * 8.0) * 0.04
		visual.scale = Vector2(pulse, pulse)
		if is_dashing:
			visual.color = Color(0.0, 0.96, 1.0, 0.9)
		else:
			visual.color = Color(0.15, 0.75, 1.0, 1.0)
