extends Node2D

## SquashStretchComponent — Deformação visual reativa a impactos (Godot 4.7.2)
## Adicionar como filho do nó visual (Sprite2D, ColorRect, Polygon2D).
## Chamar play_land() ao pousar, play_jump() ao pular, play_hit() ao receber dano.

@export var visual_node_path: NodePath = NodePath("..")

var _visual: Node2D = null

func _ready() -> void:
	_visual = get_node_or_null(visual_node_path)

func play_land() -> void:
	if not is_instance_valid(_visual): return
	var tw := create_tween().set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_ELASTIC)
	tw.tween_property(_visual, "scale", Vector2(1.3, 0.7), 0.06)
	tw.tween_property(_visual, "scale", Vector2(1.0, 1.0), 0.15)

func play_jump() -> void:
	if not is_instance_valid(_visual): return
	var tw := create_tween().set_ease(Tween.EASE_OUT).set_trans(Tween.TRANS_BACK)
	tw.tween_property(_visual, "scale", Vector2(0.7, 1.3), 0.08)
	tw.tween_property(_visual, "scale", Vector2(1.0, 1.0), 0.18)

func play_hit() -> void:
	if not is_instance_valid(_visual): return
	var tw := create_tween().set_ease(Tween.EASE_IN_OUT).set_trans(Tween.TRANS_SINE)
	tw.tween_property(_visual, "scale", Vector2(1.15, 0.85), 0.05)
	tw.tween_property(_visual, "scale", Vector2(0.85, 1.15), 0.05)
	tw.tween_property(_visual, "scale", Vector2(1.0,  1.0),  0.08)
	# Feedback háptico simultâneo (mobile/web)
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if (navigator.vibrate) navigator.vibrate(25);")
