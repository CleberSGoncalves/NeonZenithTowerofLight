extends Node

## SaveSystem — Persistência Segura em JSON (Godot 4.7.2)
## NUNCA usar get_var()/store_var() — corrompe no IndexedDB da Web.
## Sempre usar .get("chave", valor_padrao) para acesso seguro.

const SAVE_PATH := "user://savegame.json"

func salvar(dados: Dictionary) -> void:
	var temp_path := "user://savegame_temp.json"
	var final_path := SAVE_PATH
	var arquivo := FileAccess.open(temp_path, FileAccess.WRITE)
	if arquivo:
		arquivo.store_string(JSON.stringify(dados))
		arquivo.close()  # IMEDIATO — garante sync IndexedDB
		if FileAccess.file_exists(final_path):
			DirAccess.remove_absolute(final_path)
		DirAccess.rename_absolute(temp_path, final_path)

func carregar() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}
	var arquivo := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not arquivo:
		return {}
	var raw: String = arquivo.get_as_text()
	arquivo.close()
	var parsed = JSON.parse_string(raw)
	return parsed if parsed is Dictionary else {}

func obter_progresso() -> Dictionary:
	var dados: Dictionary = carregar()
	return {
		"max_level":  dados.get("max_level",  1),
		"high_score": dados.get("high_score", 0),
		"muted":      dados.get("muted",      false),
	}

func salvar_progresso(max_level: int, high_score: int, muted: bool) -> void:
	salvar({
		"max_level":  max_level,
		"high_score": high_score,
		"muted":      muted,
	})
