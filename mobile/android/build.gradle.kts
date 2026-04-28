allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    afterEvaluate {
        val androidExt = extensions.findByName("android")
        if (androidExt != null) {
            try {
                val namespaceMethod = androidExt.javaClass.getMethod("getNamespace")
                val currentNamespace = namespaceMethod.invoke(androidExt)
                if (currentNamespace == null) {
                    val groupStr = project.group.toString()
                    val setNamespaceMethod = androidExt.javaClass.getMethod("setNamespace", String::class.java)
                    setNamespaceMethod.invoke(androidExt, groupStr)
                }
                
                // Force compileSdkVersion to 36 to fix AAPT lStar error in older plugins
                try {
                    val setCompileSdkMethod = androidExt.javaClass.getMethod("setCompileSdkVersion", Int::class.java)
                    setCompileSdkMethod.invoke(androidExt, 36)
                } catch (e: Exception) {}
                
            } catch (e: Exception) {
                // Ignore if methods don't exist
            }
        }
    }
}

subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
