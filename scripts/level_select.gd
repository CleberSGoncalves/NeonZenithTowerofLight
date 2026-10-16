extends Control

## Menu de Seleção de Fases com Cards Visuais de 3 Estrelas & Progresso (Godot 4.7.2)

@onready var grid_container: GridContainer = $MarginContainer/VBoxContainer/ScrollContainer/GridContainer
@onready var mode_button: Button = $MarginContainer/VBoxContainer/TopBar/ModeButton
@onready var back_button: Button = $MarginContainer/VBoxContainer/TopBar/BackButton
@onready var total_stars_label: Label = $MarginContainer/VBoxContainer/TopBar/TotalStarsLabel

const TOTAL_LEVELS: int = 15
var saved_progress: Dictionary = {}

func _ready() -> void:
	if SaveSystem:
		saved_progress = SaveSystem.carregar()
	
	if mode_button:
		mode_button.pressed.connect(_on_toggle_game_mode)
		_update_mode_button_text()
	
	if back_button:
		back_button.pressed.connect(_on_back_pressed)
	
	_build_level_cards()

func _update_mode_button_text() -> void:
	if mode_button and GameManager:
		var mode_name = "👹 BOSS RUSH" if GameManager.current_game_mode == "boss_rush" else "⚡ MODO NORMAL"
		mode_button.text = "Modo: %s" % mode_name

func _on_toggle_game_mode() -> void:
	if GameManager:
		var new_mode = "boss_rush" if GameManager.current_game_mode == "standard" else "standard"
		GameManager.set_game_mode(new_mode)
		_update_mode_button_text()
		if EventBus:
			EventBus.play_sfx.emit("button_click")

func _build_level_cards() -> void:
	if not grid_container:
		return
	
	for child in grid_container.get_children():
		child.queue_free()
	
	var max_unlocked: int = saved_progress.get("max_level", 1)
	var stars_data: Dictionary = saved_progress.get("stars", {})
	var total_stars: int = 0
	
	for i in range(1, TOTAL_LEVELS + 1):
		var stars_earned: int = stars_data.get(str(i), 0)
		total_stars += stars_earned
		var is_locked: bool = i > max_unlocked
		
		var card := PanelContainer.new()
		card.custom_minimum_size = Vector2(220, 150)
		
		var vbox := VBoxContainer.new()
		vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		
		# Título do Card
		var title := Label.new()
		title.text = "SETOR %02d" % i
		title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(title)
		
		# Preview Visual
		var preview := ColorRect.new()
		preview.custom_minimum_size = Vector2(180, 50)
		preview.color = Color(0.08, 0.14, 0.25, 0.8) if not is_locked else Color(0.1, 0.1, 0.1, 0.5)
		vbox.add_child(preview)
		
		# Estrelas 1★ 2★ 3★
		var stars_label := Label.new()
		var star_text := ""
		for s in range(3):
			star_text += "★ " if s < stars_earned else "☆ "
		stars_label.text = star_text
		stars_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		stars_label.modulate = Color(1.0, 0.85, 0.2) if stars_earned > 0 else Color(0.5, 0.5, 0.5)
		vbox.add_child(stars_label)
		
		# Metas de Fase (1★ Concluir | 2★ Tempo | 3★ 100% Orbes)
		var meta_label := Label.new()
		meta_label.text = "1★ Cume | 2★ Par | 3★ Orbes"
		meta_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		meta_label.modulate = Color(0.6, 0.8, 1.0, 0.8)
		vbox.add_child(meta_label)
		
		# Botão de Ação / Jogar
		var play_btn := Button.new()
		play_btn.text = "JOGAR" if not is_locked else "BLOQUEADO"
		play_btn.disabled = is_locked
		play_btn.pressed.connect(func(): _on_select_level(i))
		vbox.add_child(play_btn)
		
		card.add_child(vbox)
		grid_container.add_child(card)
	
	if total_stars_label:
		total_stars_label.text = "Total de Estrelas: %d / 45 ★" % total_stars

func _on_select_level(level_index: int) -> void:
	if GameManager:
		GameManager.start_new_game()
	if EventBus:
		EventBus.play_sfx.emit("button_click")
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _on_back_pressed() -> void:
	if EventBus:
		EventBus.play_sfx.emit("button_click")
	get_tree().change_scene_to_file("res://scenes/main.tscn")
