extends Node

## Gerenciador Central de Partida, Modos de Jogo e Dificuldade Adaptativa (Godot 4.7.2)
## Conectado como Autoload GameManager

signal score_changed(new_score: int)
signal health_changed(new_health: int)
signal game_over
signal game_started
signal game_mode_changed(mode_name: String)
signal boss_wave_triggered(wave_index: int, multiplier: float)
signal adaptive_pacing_changed(rate_multiplier: float, is_critical: bool)
signal emergency_heal_spawned(position: Vector2)

# Modos de jogo: "standard" ou "boss_rush"
var current_game_mode: String = "standard"

var score: int = 0
var health: int = 100
var max_health: int = 100
var is_game_active: bool = false
var high_score: int = 0

# Boss Rush & Invasão Contínua
var boss_rush_timer: float = 0.0
var boss_wave_index: int = 0
var score_multiplier: float = 1.0
const BOSS_SPAWN_INTERVAL: float = 60.0

# Dificuldade Adaptativa
var adaptive_rate_multiplier: float = 1.0
var emergency_heal_cooldown: float = 0.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func _process(delta: float) -> void:
	if not is_game_active:
		return
	
	# Loop do Modo Boss Rush
	if current_game_mode == "boss_rush":
		boss_rush_timer += delta
		if boss_rush_timer >= BOSS_SPAWN_INTERVAL:
			boss_rush_timer = 0.0
			boss_wave_index += 1
			score_multiplier += 0.5
			boss_wave_triggered.emit(boss_wave_index, score_multiplier)
			if EventBus:
				EventBus.hud_show_message.emit("⚠️ ALERTA: CHEFÃO CHEGANDO (ONDA %d)!" % boss_wave_index, 3.5)
	
	# Dificuldade Adaptativa & Curva Suave
	_process_adaptive_difficulty(delta)

func _process_adaptive_difficulty(delta: float) -> void:
	if emergency_heal_cooldown > 0.0:
		emergency_heal_cooldown -= delta
	
	var health_ratio: float = float(health) / float(max_health)
	
	if health_ratio >= 0.99:
		# Vida cheia: acelera o ritmo em 15%
		adaptive_rate_multiplier = 1.15
		adaptive_pacing_changed.emit(adaptive_rate_multiplier, false)
	elif health_ratio < 0.30:
		# Vida crítica (<30%): alivia o ritmo e gera orbe de cura de emergência
		adaptive_rate_multiplier = 0.85
		adaptive_pacing_changed.emit(adaptive_rate_multiplier, true)
		if emergency_heal_cooldown <= 0.0:
			emergency_heal_cooldown = 15.0 # Cooldown de 15s para não abusar
			var spawn_pos := Vector2(randf_range(200, 1080), randf_range(150, 570))
			emergency_heal_spawned.emit(spawn_pos)
			if EventBus:
				EventBus.hud_show_message.emit("💚 ORBE DE REPARO QUÂNTICO LIBERADO!", 2.5)
	else:
		adaptive_rate_multiplier = 1.0
		adaptive_pacing_changed.emit(adaptive_rate_multiplier, false)

func set_game_mode(mode_name: String) -> void:
	current_game_mode = mode_name
	game_mode_changed.emit(current_game_mode)

func start_new_game() -> void:
	score = 0
	health = max_health
	is_game_active = true
	boss_rush_timer = 0.0
	boss_wave_index = 0
	score_multiplier = 1.0 if current_game_mode == "standard" else 1.2
	emergency_heal_cooldown = 0.0
	
	score_changed.emit(score)
	health_changed.emit(health)
	game_started.emit()

func add_score(points: int) -> void:
	if not is_game_active:
		return
	var final_points: int = int(points * score_multiplier)
	score += final_points
	if score > high_score:
		high_score = score
	score_changed.emit(score)
	if EventBus:
		EventBus.score_updated.emit(score)

func take_damage(amount: int) -> void:
	if not is_game_active:
		return
	health = max(0, health - amount)
	health_changed.emit(health)
	if EventBus:
		EventBus.health_updated.emit(health, max_health)
	if health <= 0:
		trigger_game_over()

func heal(amount: int) -> void:
	if not is_game_active:
		return
	health = min(max_health, health + amount)
	health_changed.emit(health)
	if EventBus:
		EventBus.health_updated.emit(health, max_health)

func trigger_game_over() -> void:
	is_game_active = false
	game_over.emit()
	if EventBus:
		EventBus.player_died.emit()
