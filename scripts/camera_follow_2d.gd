extends Camera2D

## CameraFollow2D — Câmera independente com lerp suave + look-ahead (Godot 4.7.2)
## NUNCA colocar Camera2D como filha de CharacterBody2D.
## Interpolar SEMPRE em _physics_process quando o alvo usa _physics_process.

@export var target_path: NodePath = NodePath("")
@export var smoothing_speed:     float = 10.0
@export var look_ahead_distance: float = 80.0
@export var look_ahead_speed:    float = 5.0

var _target: Node2D = null
var _look_ahead_offset: Vector2 = Vector2.ZERO

func _ready() -> void:
	if target_path:
		_target = get_node_or_null(target_path)
	# Deadzone suave para evitar enjoo visual
	drag_horizontal_enabled = true
	drag_vertical_enabled   = true
	drag_left_margin        = 0.2
	drag_right_margin       = 0.2
	drag_top_margin         = 0.15
	drag_bottom_margin      = 0.15

func _physics_process(delta: float) -> void:
	if not is_instance_valid(_target):
		return
	# Look-ahead direcional — desloca foco na direção do movimento
	var vel: Vector2 = _target.velocity if "velocity" in _target else Vector2.ZERO
	var desired_offset := vel.normalized() * look_ahead_distance if vel.length() > 10.0 else Vector2.ZERO
	_look_ahead_offset = _look_ahead_offset.lerp(desired_offset, look_ahead_speed * delta)
	global_position = global_position.lerp(
		_target.global_position + _look_ahead_offset,
		smoothing_speed * delta
	)

func set_limits(left: int, top: int, right: int, bottom: int) -> void:
	limit_left   = left
	limit_top    = top
	limit_right  = right
	limit_bottom = bottom
