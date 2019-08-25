export function randomWord(): string {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}

const WORDS_RAW = `
picture frame
gel
leg warmers
paint brush
bath fizzers
drill press
chalk
rubber duck
wireless control
word search
spring
stone
rug
thermometer
stockings
CD
fake flowers
model car
check book
vase
hanger
cookie jar
speakers
screw
grid paper
boom box
glasses
sailboat
tooth pick
helmet
puddle
toe ring
clay pot
thread
bow
flag
plastic fork
scotch tape
lamp shade
sketch pad
tissue box
balloon
shoe lace
needle
chandelier
deodorant
button
sticky note
candy wrapper
tooth paste
sharpie
shawl
eye liner
twister
photo album
pencil
sand paper
bookmark
white out
pool stick
spoon
outlet
quilt
seat belt
mouse pad
tire swing
nail filer
tampon
condom
cork
stop sign
rusty nail
gage
rubber band
zipper
canvas
sponge
pop can
key chain
earser
bottle cap
candle
face wash
lace
lip gloss
buckel
shovel
slipper
glow stick
cable
ice cube
credit card
nail clippers
thong
sun glasses
twezzers
hair tie
charger
blouse
card
cheese
bone
socks
leaf
whale
pie
shirt
orange
lollipop
bed
mouth
person
horse
snake
jar
spoon
lamp
kite
monkey
swing
cloud
snowman
baby
eyes
pen
giraffe
grapes
book
ocean
star
cupcake
cow
lips
worm
sun
basketball
hat
bus
chair
purse
head
spider
shoe
ghost
coat
chicken
heart
jellyfish
tree
seashell
duck
bracelet
grass
jacket
slide
doll
spider
clock
cup
bridge
apple
balloon
drum
ears
egg
bread
nose
house
beach
airplane
inchworm
hippo
light
turtle
ball
carrot
cherry
ice
pencil
circle
bed
ant
girl
glasses
flower
mouse
banana
alligator
bell
robot
smile
bike
rocket
dinosaur
dog
bunny
cookie
bowl
apple
door
`;

const WORDS = WORDS_RAW.split("\n");