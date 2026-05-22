import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, SharedStyles } from '../../constants/theme';
import { getRecipeSuggestions } from '../../services/api';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await getRecipeSuggestions(5);
      setRecipes(data.recipes || []);
    } catch (err: any) {
      Alert.alert('Failed', err.message + '\n\nMake sure ANTHROPIC_API_KEY is set in .env');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={SharedStyles.container}>
      <View style={SharedStyles.header}>
        <View>
          <Text style={SharedStyles.headerTitle}>Cook Now</Text>
          <Text style={SharedStyles.headerSub}>AI recipes from your pantry</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={SharedStyles.scrollContent}>
        {/* Initial State */}
        {recipes.length === 0 && !loading && (
          <>
            <View style={[SharedStyles.card, { alignItems: 'center', padding: 36, backgroundColor: Colors.bgWarm }]}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🍳</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 6 }}>
                What can I cook tonight?
              </Text>
              <Text style={{ fontSize: 13, color: Colors.textSec, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                AI scans your pantry and suggests meals — no store trip needed
              </Text>
              <TouchableOpacity style={SharedStyles.btnPrimary} onPress={generate}>
                <Text style={SharedStyles.btnPrimaryText}>🔮 Generate Recipes</Text>
              </TouchableOpacity>
            </View>

            <View style={[SharedStyles.card, { backgroundColor: Colors.blueBg, marginTop: 4 }]}>
              <Text style={{ fontSize: 13, color: Colors.blue, lineHeight: 20 }}>
                <Text style={{ fontWeight: '700' }}>💡 Note: </Text>
                Requires ANTHROPIC_API_KEY in .env. Add pantry items first for best results.
              </Text>
            </View>
          </>
        )}

        {/* Loading */}
        {loading && (
          <View style={[SharedStyles.empty, { paddingVertical: 64 }]}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</Text>
            <ActivityIndicator size="large" color={Colors.accent} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 15, fontWeight: '600' }}>Chef AI is thinking...</Text>
            <Text style={{ fontSize: 13, color: Colors.textSec, marginTop: 4 }}>
              Generating recipes from your pantry
            </Text>
          </View>
        )}

        {/* Recipes List */}
        {recipes.length > 0 && (
          <>
            <View style={[SharedStyles.badge, { backgroundColor: Colors.greenBg, padding: 10, marginBottom: 12 }]}>
              <Text style={[SharedStyles.badgeText, { color: Colors.green, fontSize: 13 }]}>
                🍽️ {recipes.length} recipes from your pantry
              </Text>
            </View>

            {recipes.map((recipe, i) => (
              <TouchableOpacity
                key={i}
                style={SharedStyles.card}
                onPress={() => setExpanded(expanded === i ? null : i)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{recipe.title}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                      {recipe.cookTimeMin && <Text style={s.meta}>⏱ {recipe.cookTimeMin} min</Text>}
                      {recipe.calories && <Text style={s.meta}>🔥 {recipe.calories} cal</Text>}
                      {recipe.difficulty && <Text style={s.meta}>📊 {recipe.difficulty}</Text>}
                    </View>
                  </View>
                  <Text style={{ fontSize: 18, color: Colors.textMuted }}>{expanded === i ? '▲' : '▼'}</Text>
                </View>

                {recipe.usesExpiringItems?.length > 0 && (
                  <View style={[SharedStyles.badge, { backgroundColor: Colors.greenBg, marginTop: 8 }]}>
                    <Text style={[SharedStyles.badgeText, { color: Colors.green }]}>
                      ✅ Uses expiring: {recipe.usesExpiringItems.join(', ')}
                    </Text>
                  </View>
                )}

                {expanded === i && (
                  <View style={s.detail}>
                    {recipe.description && (
                      <Text style={s.description}>{recipe.description}</Text>
                    )}

                    {recipe.ingredients?.length > 0 && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={SharedStyles.label}>Ingredients</Text>
                        {recipe.ingredients.map((ing: any, j: number) => (
                          <Text key={j} style={s.ingredient}>
                            • {ing.amount || ''} {ing.name} {ing.fromPantry ? '✅' : ''}
                          </Text>
                        ))}
                      </View>
                    )}

                    {recipe.steps?.length > 0 && (
                      <View>
                        <Text style={SharedStyles.label}>Steps</Text>
                        {recipe.steps.map((step: any, j: number) => (
                          <View key={j} style={s.step}>
                            <View style={s.stepNum}>
                              <Text style={s.stepNumText}>{j + 1}</Text>
                            </View>
                            <Text style={s.stepText}>
                              {typeof step === 'string' ? step : step.instruction || step}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[SharedStyles.btnSecondary, { marginTop: 8 }]} onPress={generate}>
              <Text style={SharedStyles.btnSecondaryText}>🔄 Generate New Recipes</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  meta: { fontSize: 12, color: Colors.textSec },
  detail: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  description: { fontSize: 13, color: Colors.textSec, marginBottom: 12, lineHeight: 20 },
  ingredient: { fontSize: 13, color: Colors.text, paddingVertical: 3 },
  step: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  stepNum: {
    backgroundColor: Colors.bgMuted, borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 10, fontWeight: '600', color: Colors.textSec },
  stepText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
});
