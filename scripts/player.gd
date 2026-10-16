extends CharacterBody2D

## Controlador de Jogador 2D (Godot 4.7.2 / GDScript 2.0)
## Movimentação fluida baseada em Delta Time, aceleração e amortecimento

@export var speed: float = 380.0
@export var acceleration: float = 2000.0
@export var friction: float = 1600.0

@onready var visual: ColorRect = $Visual
@onready var collision_shape: CollisionShape2D = $CollisionShape2D

func _ready() -> void:
	add_to_group("player")

func _physics_process(delta: float) -> void:
	if not GameManager or not GameManager.is_game_active:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
		move_and_slide()
		return

	var direction := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	if direction != Vector2.ZERO:
		velocity = velocity.move_toward(direction * speed, acceleration * delta)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

	move_and_slide()

	# Mantém o jogador dentro dos limites da tela (1280x720)
	position.x = clamp(position.x, 20.0, 1260.0)
	position.y = clamp(position.y, 20.0, 700.0)
