import React from 'react';

export interface AppDefinition {
    id: string;
    name: string;
    icon: string;
    color: string;
    component: React.ComponentType<any>;
}
