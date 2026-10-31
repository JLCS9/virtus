"""Listas léxicas para las heurísticas del seudonimizador.

Todo va normalizado (minúsculas, sin tildes). Si añades entradas, escríbelas ya
normalizadas o pásalas por `normalizar` al construir el conjunto.
"""

from .normalizacion import normalizar


def _conjunto(texto: str) -> frozenset[str]:
    return frozenset(normalizar(p) for p in texto.split())


# Nombres de pila frecuentes (España + Latinoamérica) y apodos habituales que no
# coinciden con palabras comunes: se marcan como persona aunque vayan en minúscula.
NOMBRES = _conjunto(
    """
    aaron abel abigail adolfo adrian adriana agustin agustina aitana aitor alba
    alberto alejandra alejandro alexis alfonso alfredo alicia alonso alvaro amaia
    amalia ana anabel andrea andres angela angeles angelica anibal antonia antonio
    ariadna ariel arturo aurelio beatriz begona belen benjamin bernardo berta
    camila candela carla carlos carlota carmen carolina catalina cayetana cecilia
    celia cesareo christian cintia claudia claudio concepcion consuelo cristian
    cristina cristobal daniel daniela dario david debora diego dolores domingo
    edgar eduardo elena eli elias elisa eloisa elsa elvira emilia emiliano emilio
    emma enrique erica ernesto esteban estefania estela esther eugenia eugenio
    eva ezequiel fabian fabiola facundo federico felipe felix fernanda fernando
    florencia francisca francisco gabriel gabriela gael genaro gerardo german
    gilberto gisela gonzalo graciela gregorio guadalupe guillermo gustavo hector
    helena heriberto hernan horacio hugo humberto ignacio iker ines inmaculada
    irene irati isaac isabel isabella ismael itziar ivan jacinto jacobo jaime
    javier jesus jimena joaquin jonathan jordi jorge josefa josefina jose josue
    juan juana julia julian juliana karen karina karla laura leandro leire leonor
    leticia lidia lorena lorenzo lourdes lucas lucia luciana luciano lucio luis
    luisa macarena magdalena maialen manuel manuela marcela marcelo marcos
    margarita maria mariana mariano maribel marisol marta martin martina mateo
    matias mauricio maximiliano mercedes miguel milagros miriam moises monica
    montserrat natalia nerea nicolas noelia noemi norberto nuria octavio olga
    oriol orlando oscar osvaldo pablo paloma paola patricia patricio paula
    pedro pilar purificacion rafael ramiro ramon raquel raul rebeca regina
    remedios renata ricardo roberto rocio rodolfo rodrigo rogelio rolando ruben
    ruth samuel sandra santiago santino sara sebastian sergio silvia simon
    sofia sonia susana tamara teodoro teresa ulises unai valentina valentin
    valeria vanesa veronica vicente victor victoria virginia walter wendy
    ximena xavier yesenia yolanda zoe

    pepe pepa pepito paco paca paquito pancho lola lolita nacho charo juanjo
    juanma chema maite conchi concha puri toni tona tono quique kike chus chelo
    lucho beto memo nando fede manolo manoli manu rafa rafi merche nati tere
    lalo pili cuca chiqui maripi mariajo marijose juanito anita carmencita
    dani javi sergi alex guille santi sebas edu nico fran isa bea cris
    montse inma encarna paqui loli angelito chuchi fito tito tita tete
    """
)

# Nombres que también son palabras comunes ("rosa", "luz", "julio", "armando"):
# solo cuentan como persona si van en mayúscula fuera de inicio de frase o justo
# detrás de un sustantivo relacional ("mi jefa rosa").
NOMBRES_AMBIGUOS = _conjunto(
    """
    rosa luz mar paz sol alma flor perla estrella violeta azucena jazmin iris
    blanca clara pura linda bella fe gloria aurora esperanza soledad amparo
    caridad dolores angeles nieves reyes cruz rosario asuncion encarnacion
    trinidad salud constancia prudencia felicidad inocencia consuelo luna
    mia abril julio armando cesar marco angel leo rey leon salvador justo
    modesto clemente severo franco amado celeste tomas vale valen marina diana
    ivana delfina lucero pastor santos domingo mati victoria milagros
    remedios concha mercedes pilar mariana mariano candela belen paloma
    margarita lourdes
    """
)

# Apellidos frecuentes: extienden un nombre detectado aunque vayan en minúscula
# ("maría lópez"). Se aceptan también los ambiguos porque solo actúan como cola.
APELLIDOS = _conjunto(
    """
    garcia lopez martinez rodriguez gonzalez fernandez sanchez perez gomez martin
    jimenez ruiz hernandez diaz moreno alvarez romero alonso gutierrez navarro
    torres dominguez vazquez ramos gil ramirez serrano blanco molina morales
    suarez ortega delgado castro ortiz rubio marin sanz iglesias medina garrido
    cortes castillo santos lozano guerrero cano prieto mendez cruz calvo gallego
    vidal leon marquez herrera pena flores cabrera campos vega fuentes carrasco
    diez caballero reyes nieto aguilar pascual santana herrero montero lorenzo
    hidalgo gimenez ibanez ferrer duran vicente mora benitez arias rojas
    sosa acosta silva mendoza vargas aguirre salazar contreras guzman cardenas
    espinoza figueroa luna paredes rivera soto valencia velasco zapata
    """
)

# Sustantivos relacionales y tratamientos: lo que viene detrás suele ser un nombre.
RELACIONALES = _conjunto(
    """
    jefe jefa jefes mujer marido esposa esposo hijo hija hijos hijas hermano
    hermana hermanos madre padre mama papa compañero compañera compañeros compi
    amigo amiga amigos novio novia pareja socio socia cliente clienta suegro
    suegra cuñado cuñada primo prima tio tia abuelo abuela sobrino sobrina nieto
    nieta vecino vecina colega profesor profesora profe director directora
    coordinador coordinadora mentor mentora padrino madrina yerno nuera ahijado
    ahijada tutor tutora entrenador entrenadora medico medica doctor doctora
    psicologo psicologa cura parroco sacerdote ex
    don doña señor señora señorita sr sra srta dr dra
    """
)

# Preposiciones y conectores tras los que una palabra en mayúscula es casi
# siempre un nombre propio en un texto de examen.
INDICIOS_PERSONA = _conjunto("a con para de del según contra sin entre y e o que como")
INDICIOS_LUGAR = _conjunto("en desde hacia hasta por")

# Palabras que pueden ir en mayúscula sin ser datos personales. Se respetan para
# no romper el sentido del texto que lee el modelo (el examen es de un método
# católico: "Dios", "Misa", "Señor" tienen que llegar tal cual).
NO_ENTIDAD = _conjunto(
    """
    dios jesucristo cristo virgen espiritu santo señor señora misa navidad
    pascua semana cuaresma adviento rosario evangelio biblia iglesia
    lunes martes miercoles jueves viernes sabado domingo
    enero febrero marzo abril mayo junio julio agosto septiembre setiembre
    octubre noviembre diciembre
    hoy ayer mañana anoche luego despues antes ahora siempre nunca tambien
    yo tu el ella nosotros vosotros ellos ellas usted ustedes
    mi mis su sus nuestro nuestra me te se le les lo la los las nos os
    un una unos unas al del y o pero que como cuando donde porque pues si no
    ok vale gracias hola bueno bien mal muy
    """
)

PARTICULAS_NOMBRE = _conjunto("de del la las los y")
