extends CanvasLayer

## Interface Gráfica e HUD Responsivo (Godot 4.7.2)
## Inclui Suporte a Boss Rush, Dificuldade Adaptativa e Menu de Fases 3★

@onready var score_label: Label = $MarginContainer/VBoxContainer/TopRow/ScoreLabel
@onready var health_bar: ProgressBar = $MarginContainer/VBoxContainer/HealthBar
@onready var game_over_panel: Panel = $GameOverPanel
@onready var pause_panel: Panel = $PausePanel

# Indicadores do Boss Rush & Dificuldade Adaptativa
var mode_label: Label
var boss_timer_label: Label

func _ready() -> void:
	if GameManager:
		GameManager.score_changed.connect(_on_score_changed)
		GameManager.health_changed.connect(_on_health_changed)
		GameManager.game_over.connect(_on_game_over)
		GameManager.boss_wave_triggered.connect(_on_boss_wave_triggered)
		GameManager.adaptive_pacing_changed.connect(_on_adaptive_pacing_changed)
	
	if game_over_panel:
		game_over_panel.visible = false
	if pause_panel:
		pause_panel.visible = false
	
	_setup_extra_indicators()

func _setup_extra_indicators() -> void:
	mode_label = Label.new()
	mode_label.position = Vector2(24, 75)
	mode_label.text = "Modo: %s" % ("👹 BOSS RUSH" if (GameManager and GameManager.current_game_mode == "boss_rush") else "⚡ NORMAL")
	add_child(mode_label)

func _process(_delta: float) -> void:
	if GameManager and GameManager.current_game_mode == "boss_rush" and GameManager.is_game_active:
		var time_left = max(0.0, GameManager.BOSS_SPAWN_INTERVAL - GameManager.boss_rush_timer)
		mode_label.text = "👹 BOSS RUSH (Onda %d) | Próx. Boss: %.1fs | Mult: x%.1f" % [
			GameManager.boss_wave_index,
			time_left,
			GameManager.score_multiplier
		]
	elif GameManager:
		mode_label.text = "Modo: ⚡ NORMAL | Dificuldade: %.0f%%" % (GameManager.adaptive_rate_multiplier * 100.0)

func _on_boss_wave_triggered(wave_index: int, multiplier: float) -> void:
	if EventBus:
		EventBus.hud_show_message.emit("🔥 ONDA DE CHEFÃO %d DISPARADA (x%.1f)" % [wave_index, multiplier], 3.0)

func _on_adaptive_pacing_changed(_rate: float, is_critical: bool) -> void:
	if health_bar:
		health_bar.modulate = Color(1.0, 0.2, 0.2) if is_critical else Color(0.1, 0.9, 0.5)

func _on_score_changed(new_score: int) -> void:
	if score_label:
		score_label.text = "Pontuação: %d" % new_score

func _on_health_changed(new_health: int) -> void:
	if health_bar:
		health_bar.value = new_health

func _on_game_over() -> void:
	if game_over_panel:
		game_over_panel.visible = true

func _on_pause_button_pressed() -> void:
	get_tree().paused = true
	if pause_panel:
		pause_panel.visible = true

func _on_resume_button_pressed() -> void:
	get_tree().paused = false
	if pause_panel:
		pause_panel.visible = false

func _on_restart_button_pressed() -> void:
	get_tree().paused = false
	if game_over_panel:
		game_over_panel.visible = false
	if GameManager:
		GameManager.start_new_game()
	get_tree().reload_current_scene()

func _on_level_select_button_pressed() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")

func _on_mute_button_pressed() -> void:
	var is_muted := AudioServer.is_bus_mute(0)
	AudioServer.set_bus_mute(0, !is_muted)
