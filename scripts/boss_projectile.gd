extends Area2D

var dir: Vector2 = Vector2.DOWN
var speed: float = 220.0
var lifetime: float = 6.0

func _ready() -> void:
	if has_meta("direction"):
		dir = get_meta("direction")
	if has_meta("speed"):
		speed = get_meta("speed")

func _process(delta: float) -> void:
	position += dir * speed * delta
	lifetime -= delta
	if lifetime <= 0.0:
		queue_free()
