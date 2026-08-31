import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function App() {
  // Navegación reducida: 1 = Simulador GPS, 2 = Sensor Real
  const [activeTab, setActiveTab] = useState(1);

  // --- ESTADOS SIMULADOR GPS ---
  const [latitude, setLatitude] = useState(4.711);
  const [longitude, setLongitude] = useState(-74.0721);
  const [accuracy, setAccuracy] = useState(50);
  const [altitude, setAltitude] = useState(2640);

  // Búsqueda / Marcador Manual por Coordenadas
  const [searchLat, setSearchLat] = useState('');
  const [searchLng, setSearchLng] = useState('');

  // Marcadores personalizados
  const [markers, setMarkers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMarkerName, setNewMarkerName] = useState('');
  const [tempCoords, setTempCoords] = useState(null);

  // --- ESTADOS SENSOR REAL ---
  const [realLocation, setRealLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  // --- FUNCIONES SIMULADOR ---
  const setBogotaCoords = () => {
    setLatitude(4.711);
    setLongitude(-74.0721);
    setAccuracy(30);
    setAltitude(2640);
  };

  const handleGoToCustomCoords = () => {
    const lat = parseFloat(searchLat);
    const lng = parseFloat(searchLng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Coordenadas inválidas', 'Por favor ingresa una Latitud (-90 a 90) y Longitud (-180 a 180) válidas.');
      return;
    }

    setLatitude(lat);
    setLongitude(lng);
    setTempCoords({ latitude: lat, longitude: lng });
    setNewMarkerName('');
    setModalVisible(true);
  };

  const handleAddMarkerCurrent = () => {
    setTempCoords({ latitude, longitude });
    setNewMarkerName('');
    setModalVisible(true);
  };

  const handleMapLongPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    setTempCoords(coords);
    setNewMarkerName('');
    setModalVisible(true);
  };

  const saveMarker = () => {
    if (!newMarkerName.trim()) {
      Alert.alert('Atención', 'Ingresa un nombre válido para el marcador.');
      return;
    }
    const newMarker = {
      id: Date.now().toString(),
      title: newMarkerName,
      latitude: tempCoords ? tempCoords.latitude : latitude,
      longitude: tempCoords ? tempCoords.longitude : longitude,
    };
    setMarkers([...markers, newMarker]);
    setModalVisible(false);
    setTempCoords(null);
    setNewMarkerName('');
  };

  const deleteMarker = (id) => {
    setMarkers(markers.filter((m) => m.id !== id));
  };

  // --- FUNCIONES SENSOR REAL ---
  const handleGetRealLocation = async () => {
    setLoadingLocation(true);
    setPermissionError(null);
    setRealLocation(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionError('Permiso denegado por el usuario. No se puede acceder a la ubicación.');
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setRealLocation(location.coords);
    } catch (error) {
      setPermissionError('Ocurrió un error al obtener la ubicación real.');
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B2545" />

      {/* HEADER SENA */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <FontAwesome5 name="satellite" size={22} color="#64DFDF" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>GEO SENA | Plataforma GPS</Text>
        </View>
        <Text style={styles.headerSubtitle}>Tecnología en Análisis y Desarrollo de Software</Text>
      </View>

      {/* PESTAÑAS */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 1 && styles.activeTabButton]}
            onPress={() => setActiveTab(1)}
          >
            <Ionicons name="map-outline" size={16} color={activeTab === 1 ? '#0B2545' : '#FFFFFF'} />
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
              Simulador GPS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 2 && styles.activeTabButton]}
            onPress={() => setActiveTab(2)}
          >
            <Ionicons name="location-outline" size={16} color={activeTab === 2 ? '#0B2545' : '#FFFFFF'} />
            <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>
              Sensor Real
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* PESTAÑA 1: SIMULADOR INTERACTIVO GPS */}
        {activeTab === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Manipulación de Coordenadas y Ubicación</Text>
            <Text style={styles.sectionSubtitle}>
              Ajusta manualmente los parámetros para simular lecturas del receptor GPS u obtén la posición de cualquier lugar ingresando sus coordenadas.
            </Text>

            {/* IR A LUGAR ESPECÍFICO */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Agregar un Lugar por Coordenadas</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.textInputSearch, { marginRight: 8 }]}
                  placeholder="Latitud (Ej: 4.6097)"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={searchLat}
                  onChangeText={setSearchLat}
                />
                <TextInput
                  style={styles.textInputSearch}
                  placeholder="Longitud (Ej: -74.0817)"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={searchLng}
                  onChangeText={setSearchLng}
                />
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleGoToCustomCoords}>
                <Ionicons name="location" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>Ir a este Lugar y Guardar Marcador</Text>
              </TouchableOpacity>
            </View>

            {/* BOTÓN UBICACIÓN POR DEFECTO */}
            <View style={styles.quickButtonsContainer}>
              <TouchableOpacity style={styles.btnSecondary} onPress={setBogotaCoords}>
                <Ionicons name="business" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>Centrar en SENA (Bogotá)</Text>
              </TouchableOpacity>
            </View>

            {/* MAPA INTERACTIVO */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={{
                  latitude: latitude,
                  longitude: longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                onLongPress={handleMapLongPress}
              >
                <Marker
                  coordinate={{ latitude, longitude }}
                  title="Posición Simulada"
                  description={`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`}
                  pinColor="#134074"
                />

                <Circle
                  center={{ latitude, longitude }}
                  radius={accuracy}
                  fillColor="rgba(0, 180, 216, 0.25)"
                  strokeColor="rgba(0, 119, 182, 0.8)"
                  strokeWidth={2}
                />

                {markers.map((item) => (
                  <Marker
                    key={item.id}
                    coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                    title={item.title}
                    pinColor="#0077B6"
                  />
                ))}
              </MapView>

              <View style={styles.mapFooter}>
                <Text style={styles.mapFooterText}>
                  Mantén presionado sobre el mapa para guardar un marcador en ese punto.
                </Text>
                <View style={styles.badgeZoom}>
                  <Text style={styles.badgeZoomText}>Zoom: ~15</Text>
                </View>
              </View>
            </View>

            {/* GESTIÓN DE MARCADORES */}
            <TouchableOpacity style={styles.btnPrimary} onPress={handleAddMarkerCurrent}>
              <Ionicons name="add-circle" size={20} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>Agregar Marcador en Posición Actual</Text>
            </TouchableOpacity>

            {markers.length > 0 && (
              <View style={styles.markersListContainer}>
                <Text style={styles.subSectionTitle}>Lugares y Marcadores Guardados:</Text>
                {markers.map((item) => (
                  <View key={item.id} style={styles.markerItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.markerTitle}>{item.title}</Text>
                      <Text style={styles.markerCoords}>
                        Lat: {item.latitude.toFixed(4)} | Lng: {item.longitude.toFixed(4)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteMarker(item.id)}>
                      <Ionicons name="trash-outline" size={22} color="#D9534F" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* CONTROLES / SLIDERS */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Ajuste Manual de Parámetros GPS</Text>

              <View style={styles.sliderGroup}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Latitud (Norte / Sur)</Text>
                  <View style={styles.badgeVal}>
                    <Text style={styles.badgeValText}>{latitude.toFixed(4)}°</Text>
                  </View>
                </View>
                <Slider
                  minimumValue={-90}
                  maximumValue={90}
                  value={latitude}
                  onSlidingComplete={(val) => setLatitude(parseFloat(val.toFixed(4)))}
                  minimumTrackTintColor="#0077B6"
                  maximumTrackTintColor="#CCC"
                  thumbTintColor="#0B2545"
                />
              </View>

              <View style={styles.sliderGroup}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Longitud (Este / Oeste)</Text>
                  <View style={styles.badgeVal}>
                    <Text style={styles.badgeValText}>{longitude.toFixed(4)}°</Text>
                  </View>
                </View>
                <Slider
                  minimumValue={-180}
                  maximumValue={180}
                  value={longitude}
                  onSlidingComplete={(val) => setLongitude(parseFloat(val.toFixed(4)))}
                  minimumTrackTintColor="#0077B6"
                  maximumTrackTintColor="#CCC"
                  thumbTintColor="#0B2545"
                />
              </View>

              <View style={styles.sliderGroup}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Precisión (Accuracy - metros)</Text>
                  <View style={styles.badgeVal}>
                    <Text style={styles.badgeValText}>{accuracy} m</Text>
                  </View>
                </View>
                <Slider
                  minimumValue={5}
                  maximumValue={500}
                  step={5}
                  value={accuracy}
                  onSlidingComplete={(val) => setAccuracy(Math.round(val))}
                  minimumTrackTintColor="#00B4D8"
                  maximumTrackTintColor="#CCC"
                  thumbTintColor="#0B2545"
                />
              </View>

              <View style={styles.sliderGroup}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.sliderLabel}>Altitud (m.s.n.m.)</Text>
                  <View style={styles.badgeVal}>
                    <Text style={styles.badgeValText}>{altitude} m</Text>
                  </View>
                </View>
                <Slider
                  minimumValue={0}
                  maximumValue={5000}
                  step={10}
                  value={altitude}
                  onSlidingComplete={(val) => setAltitude(Math.round(val))}
                  minimumTrackTintColor="#0077B6"
                  maximumTrackTintColor="#CCC"
                  thumbTintColor="#0B2545"
                />
              </View>
            </View>
          </View>
        )}

        {/* PESTAÑA 2: PROBAR SENSOR REAL */}
        {activeTab === 2 && (
          <View>
            <Text style={styles.sectionTitle}>Prueba del Sensor Geográfico de tu Dispositivo</Text>
            <Text style={styles.sectionSubtitle}>
              Interactúa con el hardware real de tu teléfono móvil invocando el módulo de ubicación de Expo.
            </Text>

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleGetRealLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="navigate-circle" size={22} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>Obtener mi Posición Actual</Text>
                </>
              )}
            </TouchableOpacity>

            {permissionError && (
              <View style={styles.alertRed}>
                <Ionicons name="close-circle" size={22} color="#D9534F" style={{ marginRight: 8 }} />
                <Text style={styles.alertRedText}>{permissionError}</Text>
              </View>
            )}

            {realLocation && (
              <View style={styles.card}>
                <Text style={styles.cardHeaderTitle}>Lectura del Sensor Real</Text>

                <View style={styles.realDataRow}>
                  <Text style={styles.realDataLabel}>Latitud:</Text>
                  <Text style={styles.realDataValue}>{realLocation.latitude.toFixed(6)}°</Text>
                </View>

                <View style={styles.realDataRow}>
                  <Text style={styles.realDataLabel}>Longitud:</Text>
                  <Text style={styles.realDataValue}>{realLocation.longitude.toFixed(6)}°</Text>
                </View>

                <View style={styles.realDataRow}>
                  <Text style={styles.realDataLabel}>Altitud:</Text>
                  <Text style={styles.realDataValue}>
                    {realLocation.altitude ? `${realLocation.altitude.toFixed(1)} m` : 'No disponible'}
                  </Text>
                </View>

                <View style={styles.realDataRow}>
                  <Text style={styles.realDataLabel}>Precisión (Accuracy):</Text>
                  <Text style={styles.realDataValue}>
                    {realLocation.accuracy ? `${realLocation.accuracy.toFixed(1)} m` : 'No disponible'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL MARCADORES */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Guardar Marcador</Text>
            <Text style={styles.modalSubtitle}>Ingresa un nombre descriptivo para guardar esta ubicación:</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Ej. Mi Casa, Parque Central, Oficina"
              value={newMarkerName}
              onChangeText={setNewMarkerName}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#6C757D' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#0077B6' }]}
                onPress={saveMarker}
              >
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  header: {
    backgroundColor: '#0B2545',
    paddingTop: Platform.OS === 'android' ? 35 : 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#0077B6',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#90E0EF',
    fontSize: 12,
    marginTop: 2,
  },
  tabsWrapper: {
    backgroundColor: '#134074',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#90E0EF',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#0B2545',
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B2545',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#4A5568',
    marginBottom: 16,
    lineHeight: 18,
  },
  quickButtonsContainer: {
    marginBottom: 14,
  },
  btnPrimary: {
    backgroundColor: '#0077B6',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  btnSecondary: {
    backgroundColor: '#134074',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  textInputSearch: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    backgroundColor: '#F8FAFC',
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: 250,
  },
  mapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapFooterText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  badgeZoom: {
    backgroundColor: '#0B2545',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeZoomText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  markersListContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0B2545',
    marginBottom: 10,
  },
  markerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  markerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  markerCoords: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0B2545',
    marginBottom: 12,
  },
  sliderGroup: {
    marginBottom: 14,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  badgeVal: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  badgeValText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369A1',
  },
  alertRed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#D9534F',
    marginVertical: 8,
  },
  alertRedText: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
  },
  realDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  realDataLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  realDataValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B2545',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B2545',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
});