import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  StyleSheet,
  Modal,
  ActivityIndicator 
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();


const API_URL = "https://68f23363b36f9750deebc71a.mockapi.io/api/v1/tasks";


async function getTasks() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro ao buscar tarefas");
    return await res.json();
  } catch (error) {
    console.error("Erro getTasks:", error);
    Alert.alert("Erro", "Não foi possível carregar as tarefas");
    return [];
  }
}

async function createTask(task) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error("Erro ao criar tarefa");
    return await res.json();
  } catch (error) {
    console.error("Erro createTask:", error);
    throw error;
  }
}

async function updateTask(id, task) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    if (!res.ok) throw new Error("Erro ao atualizar tarefa");
    return await res.json();
  } catch (error) {
    console.error("Erro updateTask:", error);
    throw error;
  }
}

async function deleteTask(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`, { 
      method: "DELETE" 
    });
    if (!res.ok) throw new Error("Erro ao excluir tarefa");
  } catch (error) {
    console.error("Erro deleteTask:", error);
    throw error;
  }
}


function HomeScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  async function loadTasks() {
    setLoading(true);
    const data = await getTasks();
    setTasks(data);
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadTasks);
    return unsubscribe;
  }, [navigation]);

  function confirmDelete(task) {
    setTaskToDelete(task);
    setDeleteModalVisible(true);
  }

  async function handleConfirmDelete() {
    if (!taskToDelete) return;
    
    try {
      await deleteTask(taskToDelete.id);
      setDeleteModalVisible(false);
      setTaskToDelete(null);
      loadTasks(); 
      Alert.alert("Sucesso", "Tarefa excluída com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível excluir a tarefa.");
    }
  }

  function handleCancelDelete() {
    setDeleteModalVisible(false);
    setTaskToDelete(null);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text>Carregando tarefas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 Lista de Tarefas</Text>

      {tasks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhuma tarefa encontrada</Text>
          <Text style={styles.emptySubtext}>Clique no botão abaixo para adicionar uma nova tarefa</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.task}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.taskDescription}>{item.description}</Text>
                ) : null}
                <Text style={styles.taskDate}>
                  Criado em: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.taskActions}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => navigation.navigate("Form", { task: item })}
                >
                  <Text style={styles.editText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(item)}
                >
                  <Text style={styles.deleteText}>🗑️ Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => navigation.navigate("Form")}
      >
        <Text style={styles.addButtonText}>＋ Nova Tarefa</Text>
      </TouchableOpacity>

      
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Exclusão</Text>
            <Text style={styles.modalText}>
              Tem certeza que deseja excluir a tarefa "{taskToDelete?.title}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleCancelDelete}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleConfirmDelete}
              >
                <Text style={styles.confirmButtonText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


function FormScreen({ route, navigation }) {
  const task = route.params?.task;
  const [title, setTitle] = useState(task ? task.title : "");
  const [description, setDescription] = useState(task ? task.description : "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert("Erro", "O título é obrigatório!");
      return;
    }

    setSaving(true);
    const newTask = { 
      title: title.trim(), 
      description: description.trim() 
    };

    try {
      if (task) {
        await updateTask(task.id, newTask);
        Alert.alert("Sucesso", "Tarefa atualizada com sucesso!");
      } else {
        await createTask(newTask);
        Alert.alert("Sucesso", "Tarefa criada com sucesso!");
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar a tarefa. Verifique sua conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {task ? "✏️ Editar Tarefa" : "➕ Nova Tarefa"}
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Título da tarefa *"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descrição (opcional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        maxLength={500}
      />
      
      <Text style={styles.charCount}>
        {description.length}/500 caracteres
      </Text>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {task ? "Atualizar" : "Criar"} Tarefa
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: "📝 Minhas Tarefas" }} 
        />
        <Stack.Screen 
          name="Form" 
          component={FormScreen} 
          options={{ title: "Formulário" }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#f7f7f7" 
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 20,
    color: "#333",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  task: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: { 
    fontSize: 16, 
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  taskDate: {
    fontSize: 12,
    color: "#999",
  },
  taskActions: {
    alignItems: "flex-end",
  },
  editButton: {
    marginBottom: 8,
  },
  editText: { 
    color: "#4caf50", 
    fontWeight: "bold",
  },
  deleteButton: {},
  deleteText: { 
    color: "#f44336", 
    fontWeight: "bold" 
  },
  addButton: {
    backgroundColor: "#2196f3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#4caf50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  saveButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
 
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: "#f44336",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});