#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Dec 19 17:49:37 2024

@author: filippodarinvidal
"""

a=5
b=10
c=a+b
print(c)
a=6.0
b=10
c=a+b
print(c)
d=True
e=16

if a==5: 
    print(a)
elif a==7:
    print(b)
elif d==False:
    print("pepe")
elif c==e:
    print("antropop")
else:
    print("marameo")
    
x,y="ciao",11    
m=(x,y)
print(m)

i=2
#il while itera fintanto che la condizione è vera
while i<5:
    i=i+2
    print(i)
    
print("\n")

for i in range(5):
    print(i)
    
    