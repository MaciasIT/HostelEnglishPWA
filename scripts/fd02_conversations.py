# -*- coding: utf-8 -*-
"""
Nuevas conversaciones de hostelería avanzada (FD-02).

10 diálogos nuevos que cubren los 5 departamentos (Recepción, Restaurante/Sala,
Bar, Cocina, Limpieza y Mantenimiento), con traducción al euskera y transcripción
IPA de cada intervención en inglés. El merge (scripts/expand_datasets.py) los
añade a public/data/conversations_extended_v4.json con id 'fd02_N'.
"""

NEW_CONVERSATIONS = [
    # ── Recepción ────────────────────────────────────────────────────────
    {
        "id": "fd02_1",
        "title": "Gestionando una queja por sobreventa",
        "title_eu": "Gainbentatzeagatiko kexa bat kudeatzen",
        "scenario": "Un huésped descubre que su reserva no está disponible por sobreventa y el recepcionista debe recolocarle.",
        "scenario_eu": "Bezero batek bere erreserba gainbentatzeagatik erabilgarri ez dagoela ikusten du, eta harreragileak berriz kokatu behar du.",
        "categoria": "Recepción",
        "participants": ["Recepcionista", "Huésped"],
        "dialogue": [
            {"speaker": "Huésped", "es": "Acabo de llegar y me dicen que no tienen mi habitación, aunque confirmé la reserva ayer.", "en": "I've just arrived and you're telling me my room isn't available, even though I confirmed the reservation yesterday.", "eu": "Oraintxe iritsi naiz eta gela ez dagoela esaten didazue, atzo erreserba baieztatu nuen arren.", "ipa": "aɪv dʒʌst əˈraɪvd ænd jɔː ˈtelɪŋ miː maɪ ruːm ˈɪznt əˈveɪləbl ˈiːvn ðəʊ aɪ kənˈfɜːmd ðə ˌrezəˈveɪʃən ˈjestədeɪ"},
            {"speaker": "Recepcionista", "es": "Le pido disculpas enormemente. Es un error por nuestra parte y se lo resolveré ahora mismo.", "en": "I sincerely apologise. This is an error on our side, and I'll sort it out right away.", "eu": "Benetan barkamena eskatzen dizut. Gure akatsa da eta berehala konponduko dut.", "ipa": "aɪ sɪnˈsɪəli əˈpɒlədʒaɪz ðɪs ɪz ən ˈerər ɒn ˈaʊə saɪd ænd aɪl sɔːt ɪt aʊt raɪt əˈweɪ"},
            {"speaker": "Recepcionista", "es": "Le he buscado una habitación de categoría superior en el hotel de al lado, sin coste adicional.", "en": "I've found you an upgraded room at the hotel next door, at no extra charge.", "eu": "Goragoko kategoriako gela bat topatu dizut ondoko hotelean, kostu gehigarririk gabe.", "ipa": "aɪv faʊnd juː ən ʌpˈɡreɪdɪd ruːm ət ðə həʊˈtel nekst dɔːr ət nəʊ ˈekstrə tʃɑːdʒ"},
            {"speaker": "Huésped", "es": "Le agradezco que lo haya resuelto tan rápido. ¿A qué distancia está el otro hotel?", "en": "Thank you for sorting it so quickly. How far is the other hotel?", "eu": "Eskerrik asko hain azkar konpontzeagatik. Zer distantziatara dago beste hotela?", "ipa": "θæŋk juː fə ˈsɔːtɪŋ ɪt səʊ ˈkwɪkli haʊ fɑːr ɪz ðiː ˈʌðə həʊˈtel"},
            {"speaker": "Recepcionista", "es": "Está a cien metros, y el taxi de cortesía le llevará ahora. De nuevo, disculpe las molestias.", "en": "It's a hundred metres away, and our complimentary taxi will drive you over now. Again, I'm sorry for the trouble.", "eu": "Ehun metrora dago, eta gure taxiak orain eramango zaitu. Berriro ere, sentitzen dut eragozpena.", "ipa": "ɪts ə ˈhʌndrəd ˈmiːtəz əˈweɪ ænd ˈaʊə ˌkɒmplɪˈmentri ˈtæksi wɪl draɪv juː ˈəʊvə naʊ əˈɡen aɪm ˈsɒri fə ðə ˈtrʌbl"},
        ],
    },
    {
        "id": "fd02_2",
        "title": "Solicitando una salida tardía",
        "title_eu": "Irteera berantiarra eskatzen",
        "scenario": "Un cliente pide dejar la habitación más tarde de lo habitual y el recepcionista negocia según disponibilidad.",
        "scenario_eu": "Bezero batek gela ohi baino beranduago uztea eskatzen du eta harreragileak erabilgarritasunaren arabera negoziatzen du.",
        "categoria": "Recepción",
        "participants": ["Recepcionista", "Huésped"],
        "dialogue": [
            {"speaker": "Huésped", "es": "Mi vuelo sale por la tarde. ¿Sería posible quedarme un par de horas más?", "en": "My flight leaves in the afternoon. Would it be possible to stay a couple of hours longer?", "eu": "Nire hegaldia arratsaldean irteten da. Posible izango litzateke beste pare bat ordu geratzea?", "ipa": "maɪ flaɪt liːvz ɪn ðiː ˌɑːftəˈnuːn wʊd ɪt biː ˈpɒsəbl tə steɪ ə ˈkʌpl əv ˈaʊəz ˈlɒŋɡə"},
            {"speaker": "Recepcionista", "es": "Déjeme comprobar la ocupación de hoy. Mientras tanto, puede dejar el equipaje en consigna sin problema.", "en": "Let me check today's occupancy. In the meantime, you can leave your luggage in our left-luggage room.", "eu": "Utzidazu gaurko okupazioa egiaztatzen. Bitartean, ekipajea kontsignan utz dezakezu arazorik gabe.", "ipa": "let miː tʃek təˈdeɪz ˈɒkjʊpənsi ɪn ðə ˈmiːntaɪm juː kæn liːv jɔː ˈlʌɡɪdʒ ɪn ˈaʊə left ˈlʌɡɪdʒ ruːm"},
            {"speaker": "Recepcionista", "es": "Como la habitación tiene una llegada a las tres, puedo ofrecerle una salida a la una sin cargo.", "en": "Since your room has an arrival at three, I can offer you a one-o'clock check-out at no charge.", "eu": "Gelak hiruretan sarrera duenez, batetan irteteko aukera eskaini diezazuket kosturik gabe.", "ipa": "sɪns jɔː ruːm hæz ən əˈraɪvl ət θriː aɪ kæn ˈɒfə juː ə wʌn əˈklɒk ˈtʃekaʊt ət nəʊ tʃɑːdʒ"},
            {"speaker": "Huésped", "es": "Perfecto, me viene estupendamente. Gracias por su flexibilidad.", "en": "Perfect, that works brilliantly for me. Thank you for being so flexible.", "eu": "Perfekto, ederki datorkit. Eskerrik asko hain malgua izateagatik.", "ipa": "ˈpɜːfɪkt ðæt wɜːks ˈbrɪliəntli fə miː θæŋk juː fə ˈbiːɪŋ səʊ ˈfleksəbl"},
        ],
    },

    # ── Restaurante / Sala ───────────────────────────────────────────────
    {
        "id": "fd02_3",
        "title": "Manejo de una alergia alimentaria",
        "title_eu": "Elikadura-alergia bat kudeatzen",
        "scenario": "Un comensal advierte de una alergia grave a los frutos secos y el camarero coordina con cocina.",
        "scenario_eu": "Jankide batek fruitu lehorrekiko alergia larria duela ohartarazten du eta zerbitzariak sukaldearekin koordinatzen du.",
        "categoria": "Restaurante",
        "participants": ["Camarero", "Comensal"],
        "dialogue": [
            {"speaker": "Comensal", "es": "Antes de pedir, debo avisarle: tengo una alergia grave a los frutos secos.", "en": "Before I order, I should let you know I have a severe nut allergy.", "eu": "Eskatu aurretik abisatu behar dizut: fruitu lehorrekiko alergia larria dut.", "ipa": "bɪˈfɔːr aɪ ˈɔːdə aɪ ʃʊd let juː nəʊ aɪ hæv ə sɪˈvɪə nʌt ˈælədʒi"},
            {"speaker": "Camarero", "es": "Gracias por avisarme. Tomo nota y se lo indico directamente al chef antes de pasar la comanda.", "en": "Thank you for letting me know. I'll flag it and tell the chef directly before I place the order.", "eu": "Eskerrik asko abisatzeagatik. Oharpena jarri eta sukaldariari zuzenean esango diot eskaera egin aurretik.", "ipa": "θæŋk juː fə ˈletɪŋ miː nəʊ aɪl flæɡ ɪt ænd tel ðə ʃef daɪˈrektli bɪˈfɔːr aɪ pleɪs ðiː ˈɔːdə"},
            {"speaker": "Camarero", "es": "Le recomiendo el plato de pescado a la brasa, que no lleva frutos secos en su elaboración.", "en": "I'd recommend the grilled fish, which contains no nuts in its preparation.", "eu": "Brasan egindako arraina gomendatzen dizut, prestatzean ez baitu fruitu lehorrik.", "ipa": "aɪd ˌrekəˈmend ðə ɡrɪld fɪʃ wɪtʃ kənˈteɪnz nəʊ nʌts ɪn ɪts ˌprepəˈreɪʃən"},
            {"speaker": "Comensal", "es": "Me tranquiliza mucho que lo tengan tan en cuenta. Tomaré el pescado, por favor.", "en": "It's reassuring that you take it so seriously. I'll have the fish, please.", "eu": "Lasaitzen nau hain serio hartzeak. Arraina hartuko dut, mesedez.", "ipa": "ɪts ˌriːəˈʃʊərɪŋ ðæt juː teɪk ɪt səʊ ˈsɪəriəsli aɪl hæv ðə fɪʃ pliːz"},
        ],
    },
    {
        "id": "fd02_4",
        "title": "Corrigiendo un error en la cuenta",
        "title_eu": "Kontuaren akats bat zuzentzen",
        "scenario": "Un cliente señala un cargo que no corresponde y el camarero verifica la factura antes de entregarla.",
        "scenario_eu": "Bezero batek ez dagokion kargu bat seinalatzen du eta zerbitzariak faktura egiaztatzen du eman aurretik.",
        "categoria": "Restaurante",
        "participants": ["Camarero", "Cliente"],
        "dialogue": [
            {"speaker": "Cliente", "es": "Disculpe, creo que me han cobrado dos postres y solo pedimos uno.", "en": "Excuse me, I think we've been charged for two desserts, and we only ordered one.", "eu": "Barkatu, bi postre kobratu dizkigutela uste dut, bakarra eskatu genuen arren.", "ipa": "ɪkˈskjuːz miː aɪ θɪŋk wiːv biːn tʃɑːdʒd fə tuː dɪˈzɜːts ænd wiː ˈəʊnli ˈɔːdəd wʌn"},
            {"speaker": "Camarero", "es": "Tiene toda la razón, ha habido un error con la comanda. Ya lo estoy corrigiendo.", "en": "You're absolutely right; there's been a mistake with the ticket. I'm correcting it now.", "eu": "Arrazoi osoa duzu; eskaeran akats bat egon da. Oraintxe zuzentzen ari naiz.", "ipa": "jɔːr ˈæbsəluːtli raɪt ðeəz biːn ə mɪˈsteɪk wɪð ðə ˈtɪkɪt aɪm kəˈrektɪŋ ɪt naʊ"},
            {"speaker": "Camarero", "es": "He retirado el cargo y le traigo la cuenta corregida. ¿Desea abonarla con tarjeta?", "en": "I've removed the charge and here's the corrected bill. Would you like to pay by card?", "eu": "Kargua kendu dut eta hemen duzu kontu zuzena. Txartelarekin ordaindu nahi duzu?", "ipa": "aɪv rɪˈmuːvd ðə tʃɑːdʒ ænd hɪəz ðə kəˈrektɪd bɪl wʊd juː laɪk tə peɪ baɪ kɑːd"},
            {"speaker": "Cliente", "es": "Sí, con tarjeta, por favor. Gracias por atenderlo tan profesionalmente.", "en": "Yes, by card, please. Thank you for handling it so professionally.", "eu": "Bai, txartelarekin, mesedez. Eskerrik asko hain era profesionalean kudeatzeagatik.", "ipa": "jes baɪ kɑːd pliːz θæŋk juː fə ˈhændlɪŋ ɪt səʊ prəˈfeʃənəli"},
        ],
    },

    # ── Bar ──────────────────────────────────────────────────────────────
    {
        "id": "fd02_5",
        "title": "Sirviendo una ronda de cócteles",
        "title_eu": "Koktel-txanda bat zerbitzatzen",
        "scenario": "Un grupo pide varios cócteles y el barman explica opciones y advierte de la medida estándar.",
        "scenario_eu": "Talde batek hainbat koktel eskatzen ditu eta tabernariak aukerak azaltzen eta neurri estandarra ohartarazten ditu.",
        "categoria": "Bar",
        "participants": ["Barman", "Cliente"],
        "dialogue": [
            {"speaker": "Cliente", "es": "Somos seis y queremos una ronda de cócteles, ¿qué nos recomienda?", "en": "There are six of us and we'd like a round of cocktails — what do you recommend?", "eu": "Sei gara eta koktel-txanda bat nahi dugu — zer gomendatzen diguzu?", "ipa": "ðeər ə sɪks əv ʌs ænd wiːd laɪk ə raʊnd əv ˈkɒkteɪlz wɒt duː juː ˌrekəˈmend"},
            {"speaker": "Barman", "es": "El mojito de la casa es muy fresco, y un clásico como el Old Fashioned se hace al momento.", "en": "Our house mojito is wonderfully refreshing, and classics like the Old Fashioned are made to order.", "eu": "Etxeko mojitoa oso freskoa da, eta Old Fashioned bezalako klasikoak momentuan egiten dira.", "ipa": "ˈaʊə haʊs məˈhiːtəʊ ɪz ˈwʌndəfəli rɪˈfreʃɪŋ ænd ˈklæsɪks laɪk ðiː əʊld ˈfæʃənd ə meɪd tʊ ˈɔːdə"},
            {"speaker": "Barman", "es": "Le informo de que los combinados se sirven con una medida estándar de alcohol.", "en": "Just so you know, our mixed drinks are poured to a standard spirit measure.", "eu": "Jakin dezazun, konbinatuak alkohol-neurri estandarrarekin zerbitzatzen dira.", "ipa": "dʒʌst səʊ juː nəʊ ˈaʊə mɪkst drɪŋks ə pɔːd tʊ ə ˈstændəd ˈspɪrɪt ˈmeʒə"},
            {"speaker": "Cliente", "es": "Perfecto, tomaremos cuatro mojitos y dos Old Fashioned. Y abra una cuenta, por favor.", "en": "Perfect, we'll take four mojitos and two Old Fashioneds. And please open a tab for us.", "eu": "Perfekto, lau mojito eta bi Old Fashioned hartuko ditugu. Eta ireki kontu bat, mesedez.", "ipa": "ˈpɜːfɪkt wiːl teɪk fɔː məˈhiːtəʊz ænd tuː əʊld ˈfæʃəndz ænd pliːz ˈəʊpən ə tæb fər ʌs"},
        ],
    },
    {
        "id": "fd02_6",
        "title": "Corte de suministro en la barra",
        "title_eu": "Barrako hornidura etetea",
        "scenario": "Se va la luz de la cafetera y el barman ofrece alternativas mientras avisa a mantenimiento.",
        "scenario_eu": "Kafe-makinaren argia joaten da eta tabernariak alternatibak eskaintzen ditu mantentze-lanei abisatzen dien bitartean.",
        "categoria": "Bar",
        "participants": ["Barman", "Cliente"],
        "dialogue": [
            {"speaker": "Cliente", "es": "¿Qué ha pasado? Justo se ha apagado la cafetera y estaba esperando un descafeinado.", "en": "What happened? The coffee machine just went off, and I was waiting for a decaf.", "eu": "Zer gertatu da? Kafe-makina oraintxe itzali da eta kafeina gabekoaren zain nengoen.", "ipa": "wɒt ˈhæpənd ðə ˈkɒfi məˈʃiːn dʒʌst went ɒf ænd aɪ wəz ˈweɪtɪŋ fər ə ˈdiːkæf"},
            {"speaker": "Barman", "es": "Disculpe el contratiempo. Es un fallo eléctrico puntual; ya he avisado a mantenimiento.", "en": "Sorry for the hiccup. It's a minor power fault, and I've already called maintenance.", "eu": "Barkatu eragozpenagatik. Puntualki izandako matxura elektriko bat da; mantentze-lanei abisatu diet jada.", "ipa": "ˈsɒri fə ðə ˈhɪkʌp ɪts ə ˈmaɪnə ˈpaʊə fɔːlt ænd aɪv ɔːlˈredi kɔːld ˈmeɪntənəns"},
            {"speaker": "Barman", "es": "Mientras lo reparan, puedo prepararle un café de puchero o un té, si lo prefiere.", "en": "While they fix it, I can make you a brewed coffee or a tea, if you'd prefer.", "eu": "Konpontzen duten bitartean, eltzeko-kafe bat edo te bat presta diezazuket, nahiago baduzu.", "ipa": "waɪl ðeɪ fɪks ɪt aɪ kæn meɪk juː ə bruːd ˈkɒfi ɔːr ə tiː ɪf juːd prɪˈfɜː"},
            {"speaker": "Cliente", "es": "Muy amable, tomaré un té. No se preocupe, comprendo que estas cosas pasan.", "en": "That's very kind, I'll have a tea. Don't worry, I understand these things happen.", "eu": "Oso jatorra zara, tea hartuko dut. Ez kezkatu, ulertzen dut halako gauzak gertatzen direla.", "ipa": "ðæts ˈveri kaɪnd aɪl hæv ə tiː dəʊnt ˈwʌri aɪ ˌʌndəˈstænd ðiːz θɪŋz ˈhæpən"},
        ],
    },

    # ── Cocina ───────────────────────────────────────────────────────────
    {
        "id": "fd02_7",
        "title": "Coordinando la comanda en cocina",
        "title_eu": "Sukaldean eskaera koordinatzen",
        "scenario": "El jefe de partida organiza las mesas en pleno servicio y reasigna tareas para no retrasarse.",
        "scenario_eu": "Partidako buruak mahaiak zerbitzu betean antolatzen ditu eta zereginak berriz esleitzen ditu atzeratu ez dadin.",
        "categoria": "Cocina",
        "participants": ["Jefe de partida", "Cocinero"],
        "dialogue": [
            {"speaker": "Jefe de partida", "es": "La mesa ocho pide cuatro entrantes a la vez. ¿Tienes la mise en place lista?", "en": "Table eight just ordered four starters at once. Is your mise en place ready?", "eu": "Zortzigarren mahaiak lau sarrerako eskatu ditu batera. Mise en place prest al duzu?", "ipa": "ˈteɪbl eɪt dʒʌst ˈɔːdəd fɔː ˈstɑːtəz ət wʌns ɪz jɔː ˌmiːz ɒn ˈplɑːs ˈredi"},
            {"speaker": "Cocinero", "es": "Lista, sí. Tengo las verduras escaldadas y la salsa reducida al punto.", "en": "Ready, yes. The vegetables are blanched and the sauce is reduced just right.", "eu": "Prest, bai. Barazkiak galdarraztatu ditut eta saltsa puntura murriztua dut.", "ipa": "ˈredi jes ðə ˈvedʒtəblz ə blɑːntʃt ænd ðə sɔːs ɪz rɪˈdjuːst dʒʌst raɪt"},
            {"speaker": "Jefe de partida", "es": "Marque los platos por orden y acompáñalos con la guarnición indicada en la comanda.", "en": "Fire the dishes in order and plate them with the garnish listed on the ticket.", "eu": "Platerak ordenan atera eta eskaeran adierazitako lagungarriarekin muntatu.", "ipa": "ˈfaɪə ðə ˈdɪʃɪz ɪn ˈɔːdər ænd pleɪt ðem wɪð ðə ˈɡɑːnɪʃ ˈlɪstɪd ɒn ðə ˈtɪkɪt"},
            {"speaker": "Cocinero", "es": "Hecho. Los tengo en dos minutos y aviso al pase en cuanto estén.", "en": "On it. I'll have them in two minutes and call the pass as soon as they're ready.", "eu": "Egina. Bi minututan izango ditut eta abisatuko dut prest daudenean.", "ipa": "ɒn ɪt aɪl hæv ðem ɪn tuː ˈmɪnɪts ænd kɔːl ðə pɑːs æz suːn æz ðeə ˈredi"},
        ],
    },
    {
        "id": "fd02_8",
        "title": "Protocolo de alérgenos en cocina",
        "title_eu": "Alergeno-protokoloa sukaldean",
        "scenario": "Entra una comanda con alergia y el equipo revisa la higiene cruzada antes de emplatar.",
        "scenario_eu": "Alergiadun eskaera bat sartzen da eta taldeak gurutzatze-higienea berrikusten du muntatu aurretik.",
        "categoria": "Cocina",
        "participants": ["Jefe de cocina", "Ayudante"],
        "dialogue": [
            {"speaker": "Jefe de cocina", "es": "Entra una comanda con alergia al marisco. ¿Está limpia la plancha?", "en": "We've got a ticket with a shellfish allergy. Is the griddle clean?", "eu": "Itsaskiekiko alergia duen eskaera bat sartu da. Plancha garbi al dago?", "ipa": "wiːv ɡɒt ə ˈtɪkɪt wɪð ə ˈʃelfɪʃ ˈælədʒi ɪz ðə ˈɡrɪdl kliːn"},
            {"speaker": "Ayudante", "es": "Sí, la he desengrasado y desinfectado después del último plato de gambas.", "en": "Yes, I degreased and sanitised it after the last prawn dish.", "eu": "Bai, azken ganba-plateraren ondoren koipegabetu eta desinfektatu dut.", "ipa": "jes aɪ diːˈɡriːzd ænd ˈsænɪtaɪzd ɪt ˈɑːftə ðə lɑːst prɔːn dɪʃ"},
            {"speaker": "Jefe de cocina", "es": "Perfecto. Usa utensilios separados y cambia los guantes antes de tocar ese plato.", "en": "Perfect. Use separate utensils and change your gloves before touching that plate.", "eu": "Perfekto. Erabili tresna bereiziak eta aldatu eskularruak plater hori ukitu aurretik.", "ipa": "ˈpɜːfɪkt juːz ˈseprət juːˈtensɪlz ænd tʃeɪndʒ jɔː ɡlʌvz bɪˈfɔː ˈtʌtʃɪŋ ðæt pleɪt"},
            {"speaker": "Ayudante", "es": "Entendido. Lo preparo sin ningún tipo de contaminación cruzada.", "en": "Understood. I'll prepare it with no cross-contamination whatsoever.", "eu": "Ulertuta. Gurutzatze-kutsadura batere gabe prestatuko dut.", "ipa": "ˌʌndəˈstʊd aɪl prɪˈpeər ɪt wɪð nəʊ krɒs kənˌtæmɪˈneɪʃən ˌwɒtsəʊˈevə"},
        ],
    },

    # ── Limpieza / Pisos ─────────────────────────────────────────────────
    {
        "id": "fd02_9",
        "title": "Atendiendo una petición de limpieza extra",
        "title_eu": "Aparteko garbiketa-eskaera bat atenditzen",
        "scenario": "Un huésped pide una limpieza adicional por un derrame y el equipo de pisos acude con rapidez.",
        "scenario_eu": "Bezero batek isurketa baten ondoriozko aparteko garbiketa eskatzen du eta pisuetako taldea azkar joaten da.",
        "categoria": "Limpieza",
        "participants": ["Gobernanta", "Huésped"],
        "dialogue": [
            {"speaker": "Huésped", "es": "Se me ha derramado una bebida en la moqueta. ¿Podrían limpiarlo lo antes posible?", "en": "I've spilt a drink on the carpet. Could you clean it up as soon as possible?", "eu": "Edari bat isuri zait alfonbra gainera. Ahalik eta azkarren garbituko zenukete?", "ipa": "aɪv spɪlt ə drɪŋk ɒn ðə ˈkɑːpɪt kʊd juː kliːn ɪt ʌp æz suːn æz ˈpɒsəbl"},
            {"speaker": "Gobernanta", "es": "Por supuesto, no se preocupe. Subo ahora mismo con el equipo de manchas.", "en": "Of course, don't worry. I'll come up right away with the stain kit.", "eu": "Noski, ez kezkatu. Oraintxe igoko naiz orbain-kit-arekin.", "ipa": "əv kɔːs dəʊnt ˈwʌri aɪl kʌm ʌp raɪt əˈweɪ wɪð ðə steɪn kɪt"},
            {"speaker": "Gobernanta", "es": "Ya está limpio y seco en su mayor parte. Lo repasaremos de nuevo en la limpieza de la tarde.", "en": "It's mostly clean and dry now. We'll go over it again during the afternoon service.", "eu": "Garbi eta lehor dago gehienbat. Arratsaldeko zerbitzuan berriro errepasatuko dugu.", "ipa": "ɪts ˈməʊstli kliːn ænd draɪ naʊ wiːl ɡəʊ ˈəʊvər ɪt əˈɡen ˈdjʊərɪŋ ðiː ˌɑːftəˈnuːn ˈsɜːvɪs"},
            {"speaker": "Huésped", "es": "Muchísimas gracias por la rapidez. Han sido muy amables.", "en": "Thank you so much for being so quick. You've been very kind.", "eu": "Mila esker azkartasunagatik. Oso jatorrak izan zarete.", "ipa": "θæŋk juː səʊ mʌtʃ fə ˈbiːɪŋ səʊ kwɪk juːv biːn ˈveri kaɪnd"},
        ],
    },

    # ── Mantenimiento ────────────────────────────────────────────────────
    {
        "id": "fd02_10",
        "title": "Reparación urgente de un grifo que gotea",
        "title_eu": "Isurtzen duen txorrota baten konponketa urgentziaz",
        "scenario": "Un huésped reporta una fuga en el baño y el técnico de mantenimiento la localiza y resuelve.",
        "scenario_eu": "Bezero batek bainugelako ihes bat salatzen du eta mantentze-teknikariak kokatu eta konpontzen du.",
        "categoria": "Mantenimiento",
        "participants": ["Técnico", "Huésped"],
        "dialogue": [
            {"speaker": "Huésped", "es": "El grifo del lavabo gotea sin parar y hace ruido toda la noche.", "en": "The sink tap won't stop dripping and it's noisy all night long.", "eu": "Harraskako txorrotak etengabe isurtzen du eta gau osoan zarata egiten du.", "ipa": "ðə sɪŋk tæp wəʊnt stɒp ˈdrɪpɪŋ ænd ɪts ˈnɔɪzi ɔːl naɪt lɒŋ"},
            {"speaker": "Técnico", "es": "Déjeme revisarlo. Probablemente sea la junta desgastada, la cambio en seguida.", "en": "Let me take a look. It's likely a worn washer, and I'll replace it in no time.", "eu": "Utzidazu berrikusten. Seguruenik junta higatua da, eta berehala aldatuko dut.", "ipa": "let miː teɪk ə lʊk ɪts ˈlaɪkli ə wɔːn ˈwɒʃər ænd aɪl rɪˈpleɪs ɪt ɪn nəʊ taɪm"},
            {"speaker": "Técnico", "es": "Ya corto el agua un instante. Listo, la junta quedó sustituida y no gotea más.", "en": "I'll shut the water off for a moment. There — the washer's replaced and the drip has stopped.", "eu": "Ura une batez etengo dut. Kito, junta ordezkatuta eta ez du gehiago isurtzen.", "ipa": "aɪl ʃʌt ðə ˈwɔːtər ɒf fər ə ˈməʊmənt ðeə ðə ˈwɒʃəz rɪˈpleɪst ænd ðə drɪp həz stɒpt"},
            {"speaker": "Huésped", "es": "Excelente servicio. Muchas gracias por llegar tan pronto.", "en": "Excellent service. Thank you so much for coming so promptly.", "eu": "Zerbitzu bikaina. Eskerrik asko hain azkar etortzeagatik.", "ipa": "ˈeksələnt ˈsɜːvɪs θæŋk juː səʊ mʌtʃ fə ˈkʌmɪŋ səʊ ˈprɒmptli"},
        ],
    },
]

assert len(NEW_CONVERSATIONS) == 10, len(NEW_CONVERSATIONS)